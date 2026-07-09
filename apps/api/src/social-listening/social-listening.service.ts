import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  SocialListeningSetupActor,
  SocialListeningSetupStatus,
} from '@cocreate/database'
import { PrismaService } from '../prisma/prisma.service'
import type { AuthenticatedClient } from '../auth/auth.service'
import { ClientAccessService } from '../auth/client-access.service'
import { Brand24Service } from './brand24.service'
import { parseUtcDateOnly } from './social-listening-dates'
import type { CreateListeningSetupInput } from '@cocreate/api-contracts/v1/requests/social-listening'
import { SocialListeningSnapshotService } from './social-listening-snapshot.service'
import {
  enumerateUtcMonthlySnapshotDates,
  validateListeningSetupDateRange,
} from './social-listening-setup-dates'
import type {
  SocialListeningAnalyticsResponse,
  SocialListeningCompareResponse,
  SocialListeningSnapshotDatesResponse,
} from './social-listening.types'

@Injectable()
export class SocialListeningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brand24: Brand24Service,
    private readonly snapshots: SocialListeningSnapshotService,
    private readonly clientAccess: ClientAccessService,
  ) {}

  private assertSocialListeningUser(client: AuthenticatedClient) {
    if (!this.clientAccess.canUseSocialListening(client)) {
      throw new ForbiddenException(
        'Social Listening is not enabled for your account',
      )
    }
  }

  async getAnalyticsForClient(
    client: AuthenticatedClient,
    asOf?: string,
  ): Promise<SocialListeningAnalyticsResponse> {
    this.assertSocialListeningUser(client)
    const organization = await this.requireSubscriberOrg(client)
    return this.getAnalyticsForOrganization(organization, asOf)
  }

  async getAnalyticsForOrganization(
    organization: {
      id: string
      brand24ProjectId: string | null
    },
    asOf?: string,
  ): Promise<SocialListeningAnalyticsResponse> {
    await this.snapshots.ensureDemoSnapshots(organization)

    if (asOf) {
      const date = parseUtcDateOnly(asOf)
      if (!date) {
        throw new BadRequestException('asOf must be YYYY-MM-DD')
      }
      const snapshot = await this.snapshots.getSnapshot(organization, date)
      if (!snapshot) {
        throw new NotFoundException(`No snapshot for ${asOf}`)
      }
      return snapshot
    }

    if (this.snapshots.isEnabled()) {
      const latestSnapshot = await this.snapshots.getSnapshot(organization)
      if (latestSnapshot) return latestSnapshot
    }

    const { data, source } = await this.brand24.fetchAnalytics(
      organization.id,
      organization.brand24ProjectId,
    )

    return {
      ok: true,
      data,
      meta: {
        source,
        organizationId: organization.id,
        brand24ProjectId: organization.brand24ProjectId,
        fetchedAt: new Date().toISOString(),
        fromSnapshot: false,
      },
    }
  }

  async listSnapshotDatesForClient(
    client: AuthenticatedClient,
    limit?: number,
  ): Promise<SocialListeningSnapshotDatesResponse> {
    this.assertSocialListeningUser(client)
    const organization = await this.requireSubscriberOrg(client)
    return this.listSnapshotDatesForOrganization(organization.id, limit)
  }

  async listSnapshotDatesForOrganization(
    organizationId: string,
    limit?: number,
  ): Promise<SocialListeningSnapshotDatesResponse> {
    const organization = await this.requireSubscriberOrgById(organizationId)
    await this.snapshots.ensureDemoSnapshots(organization)
    const parsedLimit = limit ? Number.parseInt(String(limit), 10) : 90
    const safeLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 && parsedLimit <= 365
        ? parsedLimit
        : 90
    const org = await this.prisma.organization.findUnique({
      where: { id: organization.id },
      select: { name: true },
    })
    return this.snapshots.listSnapshotDates(organization.id, safeLimit, org?.name)
  }

  async createListeningSetupForClient(
    client: AuthenticatedClient,
    dto: CreateListeningSetupInput,
  ) {
    this.assertSocialListeningUser(client)
    const organizationId = client.organization?.id
    if (!organizationId) {
      throw new ForbiddenException('No organization linked to this account')
    }
    return this.createListeningSetup({
      organizationId,
      dto,
      actor: 'CLIENT',
      userId: client.id,
    })
  }

  async createListeningSetup(params: {
    organizationId: string
    dto: CreateListeningSetupInput
    actor: 'CLIENT' | 'ADMIN'
    userId?: string
  }) {
    await this.requireSubscriberOrgById(params.organizationId)

    const { start, end } = validateListeningSetupDateRange(
      params.dto.startDate,
      params.dto.endDate,
    )

    await this.prisma.socialListeningSetup.updateMany({
      where: {
        organizationId: params.organizationId,
        status: SocialListeningSetupStatus.ACTIVE,
      },
      data: { status: SocialListeningSetupStatus.ARCHIVED },
    })

    const activeSources = this.brand24.mapPlatformsToActiveSources(params.dto.platforms)
    const { projectId } = await this.brand24.addProject({
      keywords: params.dto.keywords,
      activeSources,
      projectName: params.organizationId,
    })

    await this.prisma.organization.update({
      where: { id: params.organizationId },
      data: { brand24ProjectId: projectId },
    })

    const orgContext = { id: params.organizationId, brand24ProjectId: projectId }
    const dates = enumerateUtcMonthlySnapshotDates(start, end)

    for (const snapshotDate of dates) {
      await this.snapshots.captureSnapshot(orgContext, snapshotDate)
    }

    const setup = await this.prisma.socialListeningSetup.create({
      data: {
        organizationId: params.organizationId,
        status: SocialListeningSetupStatus.ACTIVE,
        keywords: params.dto.keywords as object,
        platforms: params.dto.platforms as object,
        startDate: start,
        endDate: end,
        brand24ProjectId: projectId,
        snapshotsCaptured: dates.length,
        createdByActor:
          params.actor === 'ADMIN'
            ? SocialListeningSetupActor.ADMIN
            : SocialListeningSetupActor.CLIENT,
        createdByUserId: params.userId ?? null,
      },
    })

    return {
      ok: true as const,
      setupId: setup.id,
      brand24ProjectId: projectId,
      snapshotsCaptured: dates.length,
      startDate: params.dto.startDate,
      endDate: params.dto.endDate,
    }
  }

  async compareForClient(
    client: AuthenticatedClient,
    baseline: string,
    current?: string,
  ): Promise<SocialListeningCompareResponse> {
    this.assertSocialListeningUser(client)
    const organization = await this.requireSubscriberOrg(client)
    return this.compareForOrganization(organization, baseline, current)
  }

  async compareForOrganization(
    organization: { id: string; brand24ProjectId: string | null },
    baseline: string,
    current?: string,
  ): Promise<SocialListeningCompareResponse> {
    await this.snapshots.ensureDemoSnapshots(organization)

    const baselineDate = parseUtcDateOnly(baseline)
    if (!baselineDate) {
      throw new BadRequestException('baseline must be YYYY-MM-DD')
    }

    let currentDate: Date | undefined
    if (current) {
      const parsed = parseUtcDateOnly(current)
      if (!parsed) {
        throw new BadRequestException('current must be YYYY-MM-DD')
      }
      currentDate = parsed
    }

    return this.snapshots.compare(organization, baselineDate, currentDate)
  }

  private async requireSubscriberOrgById(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        isSocialListeningSubscriber: true,
        brand24ProjectId: true,
      },
    })

    if (!organization) {
      throw new NotFoundException('Organization not found')
    }

    if (!organization.isSocialListeningSubscriber) {
      throw new ForbiddenException(
        'Social Listening is not enabled for this organization',
      )
    }

    return organization
  }

  private async requireSubscriberOrg(client: AuthenticatedClient) {
    const organizationId = client.organization?.id
    if (!organizationId) {
      throw new ForbiddenException('No organization linked to this account')
    }
    return this.requireSubscriberOrgById(organizationId)
  }
}
