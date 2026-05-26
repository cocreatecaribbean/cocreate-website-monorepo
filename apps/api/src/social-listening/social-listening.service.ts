import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { AuthenticatedClient } from '../auth/auth.service'
import { Brand24Service } from './brand24.service'
import { parseUtcDateOnly } from './social-listening-dates'
import type { CreateListeningSetupDto } from './dto/create-listening-setup.dto'
import { SocialListeningSnapshotService } from './social-listening-snapshot.service'
import {
  enumerateUtcDatesInclusive,
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
  ) {}

  async getAnalyticsForClient(
    client: AuthenticatedClient,
    asOf?: string,
  ): Promise<SocialListeningAnalyticsResponse> {
    const organization = await this.requireSubscriberOrg(client)
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

      await this.snapshots.captureSnapshot(organization)
      const saved = await this.snapshots.getSnapshot(organization)
      if (saved) return saved
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
    const organization = await this.requireSubscriberOrg(client)
    await this.snapshots.ensureDemoSnapshots(organization)
    const parsedLimit = limit ? Number.parseInt(String(limit), 10) : 90
    const safeLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 && parsedLimit <= 365
        ? parsedLimit
        : 90
    return this.snapshots.listSnapshotDates(organization.id, safeLimit)
  }

  async createListeningSetupForClient(
    client: AuthenticatedClient,
    dto: CreateListeningSetupDto,
  ) {
    const organization = await this.requireSubscriberOrg(client)
    const { start, end } = validateListeningSetupDateRange(
      dto.startDate,
      dto.endDate,
    )

    const activeSources = this.brand24.mapPlatformsToActiveSources(dto.platforms)
    const { projectId } = await this.brand24.addProject({
      keywords: dto.keywords,
      activeSources,
      projectName: organization.id,
    })

    await this.prisma.organization.update({
      where: { id: organization.id },
      data: { brand24ProjectId: projectId },
    })

    const orgContext = { id: organization.id, brand24ProjectId: projectId }
    const dates = enumerateUtcDatesInclusive(start, end)

    for (const snapshotDate of dates) {
      await this.snapshots.captureSnapshot(orgContext, snapshotDate)
    }

    return {
      ok: true as const,
      brand24ProjectId: projectId,
      snapshotsCaptured: dates.length,
      startDate: dto.startDate,
      endDate: dto.endDate,
    }
  }

  async compareForClient(
    client: AuthenticatedClient,
    baseline: string,
    current?: string,
  ): Promise<SocialListeningCompareResponse> {
    const organization = await this.requireSubscriberOrg(client)
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

  private async requireSubscriberOrg(client: AuthenticatedClient) {
    const organizationId = client.organization?.id
    if (!organizationId) {
      throw new ForbiddenException('No organization linked to this account')
    }

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
}
