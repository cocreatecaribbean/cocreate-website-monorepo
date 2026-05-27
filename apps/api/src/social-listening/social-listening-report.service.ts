import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  getReportTemplate,
  listReportTemplates,
  renderReportToBuffer,
  type ReportCompareBundle,
  type ReportRenderContext,
  type ReportTemplateId,
} from '@cocreate/social-listening-reports'
import type { AuthenticatedClient } from '../auth/auth.service'
import { ClientAccessService } from '../auth/client-access.service'
import { PrismaService } from '../prisma/prisma.service'
import { parseUtcDateOnly } from './social-listening-dates'
import { SocialListeningSnapshotService } from './social-listening-snapshot.service'
import type { SocialListeningCompareResponse } from './social-listening.types'

export type ReportTemplatesListResponse = {
  ok: true
  templates: ReturnType<typeof listReportTemplates>
}

@Injectable()
export class SocialListeningReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly snapshots: SocialListeningSnapshotService,
    private readonly clientAccess: ClientAccessService,
  ) {}

  listTemplates(): ReportTemplatesListResponse {
    return { ok: true, templates: listReportTemplates() }
  }

  async generatePdfForClient(
    client: AuthenticatedClient,
    templateId: string,
    asOf?: string,
    baseline?: string,
    current?: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const template = getReportTemplate(templateId)
    if (!template) {
      throw new BadRequestException(`Unknown report template: ${templateId}`)
    }

    if (!this.clientAccess.canUseSocialListening(client)) {
      throw new ForbiddenException(
        'Social Listening is not enabled for your account',
      )
    }

    const organization = await this.requireSubscriberOrg(client)

    let compare: SocialListeningCompareResponse | undefined
    if (template.supportsCompare) {
      if (!baseline) {
        throw new BadRequestException(
          'baseline date is required for this template (YYYY-MM-DD)',
        )
      }
      compare = await this.compareForClient(client, baseline, current)
    }

    let snapshotResponse
    if (asOf) {
      const date = parseUtcDateOnly(asOf)
      if (!date) {
        throw new BadRequestException('asOf must be YYYY-MM-DD')
      }
      const row = await this.snapshots.getSnapshot(organization, date)
      if (!row) {
        throw new NotFoundException(`No snapshot for ${asOf}`)
      }
      snapshotResponse = row
    } else if (compare) {
      snapshotResponse = {
        ok: true as const,
        data: compare.current.data,
        meta: compare.current.meta,
      }
    } else {
      snapshotResponse = await this.snapshots.getSnapshot(organization)
      if (!snapshotResponse) {
        await this.snapshots.captureSnapshot(organization)
        snapshotResponse = await this.snapshots.getSnapshot(organization)
      }
      if (!snapshotResponse) {
        throw new NotFoundException('No snapshot available to generate a report')
      }
    }

    const context: ReportRenderContext = {
      organization: {
        name: organization.name,
        slug: organization.slug,
        logoUrl: organization.logoUrl,
      },
      snapshot: {
        data: snapshotResponse.data,
        meta: snapshotResponse.meta,
      },
      compare: compare ? this.toReportCompare(compare) : undefined,
      generatedAt: new Date().toISOString(),
    }

    const buffer = await renderReportToBuffer(
      templateId as ReportTemplateId,
      context,
    )

    const slug = organization.slug ?? 'report'
    const date =
      snapshotResponse.meta.snapshotDate?.slice(0, 10) ??
      new Date().toISOString().slice(0, 10)
    const filename = `${slug}-${templateId}-${date}.pdf`

    return { buffer, filename }
  }

  private toReportCompare(
    compare: SocialListeningCompareResponse,
  ): ReportCompareBundle {
    return {
      baseline: {
        date: compare.baseline.date,
        data: compare.baseline.data,
        meta: compare.baseline.meta,
      },
      current: {
        date: compare.current.date,
        data: compare.current.data,
        meta: compare.current.meta,
      },
      deltas: compare.deltas,
    }
  }

  private async compareForClient(
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
      throw new BadRequestException('No organization linked to this account')
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        isSocialListeningSubscriber: true,
        brand24ProjectId: true,
      },
    })

    if (!organization?.isSocialListeningSubscriber) {
      throw new BadRequestException(
        'Social Listening is not enabled for this organization',
      )
    }

    return organization
  }
}
