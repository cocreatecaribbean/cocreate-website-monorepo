import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Prisma } from '@cocreate/database'
import { PrismaService } from '../prisma/prisma.service'
import { Brand24Service } from './brand24.service'
import { buildOrgScopedMockAnalytics } from './org-scoped-mock'
import {
  calendarMonthPeriodForSnapshot,
  firstDayOfUtcCalendarMonth,
  formatUtcDateOnly,
  parseUtcDateOnly,
  previousCalendarMonthSnapshotDate,
  utcTodayDateOnly,
} from './social-listening-dates'
import type {
  SentimentId,
  SocialListeningAnalytics,
  SocialListeningAnalyticsMeta,
  SocialListeningAnalyticsResponse,
  SocialListeningCompareResponse,
  SocialListeningMetricDelta,
  SocialListeningSnapshotDatesResponse,
} from './social-listening.types'

type OrgSnapshotContext = {
  id: string
  brand24ProjectId: string | null
}

function totalMentionsFromPayload(payload: unknown): number | undefined {
  if (!payload || typeof payload !== 'object') return undefined
  const summary = (payload as { sentimentSummary?: Array<{ value?: number }> })
    .sentimentSummary
  if (!Array.isArray(summary) || summary.length === 0) return undefined
  const total = summary.reduce((sum, slice) => sum + (slice.value ?? 0), 0)
  return total > 0 ? total : undefined
}

@Injectable()
export class SocialListeningSnapshotService {
  private readonly logger = new Logger(SocialListeningSnapshotService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly brand24: Brand24Service,
    private readonly config: ConfigService,
  ) {}

  isEnabled(): boolean {
    return this.config.get<string>('SOCIAL_LISTENING_SNAPSHOT_ENABLED') !== 'false'
  }

  private maxAgeHours(): number {
    const raw = this.config.get<string>('SOCIAL_LISTENING_SNAPSHOT_MAX_AGE_HOURS')
    const parsed = raw ? Number.parseInt(raw, 10) : 24
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 24
  }

  retentionDays(): number {
    const raw = this.config.get<string>('SOCIAL_LISTENING_SNAPSHOT_RETENTION_DAYS')
    const parsed = raw ? Number.parseInt(raw, 10) : 548
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 548
  }

  isDemoSnapshotsEnabled(): boolean {
    return this.config.get<string>('SOCIAL_LISTENING_DEMO_SNAPSHOTS') === 'true'
  }

  /**
   * Dev/demo: seed two monthly snapshots (prior month + month before) using org-scoped mock.
   * Idempotent — only creates rows that are missing.
   */
  async ensureDemoSnapshots(organization: OrgSnapshotContext): Promise<void> {
    if (!this.isEnabled() || !this.isDemoSnapshotsEnabled()) return

    const today = utcTodayDateOnly()
    const latest = previousCalendarMonthSnapshotDate(today)
    const baseline = previousCalendarMonthSnapshotDate(firstDayOfUtcCalendarMonth(latest))

    for (const snapshotDate of [baseline, latest]) {
      const dateOnly = parseUtcDateOnly(formatUtcDateOnly(snapshotDate))!
      const existing = await this.prisma.socialListeningSnapshot.findUnique({
        where: {
          organizationId_snapshotDate: {
            organizationId: organization.id,
            snapshotDate: dateOnly,
          },
        },
        select: { id: true },
      })
      if (!existing) {
        await this.captureSnapshot(organization, snapshotDate)
      }
    }
  }

  async captureSnapshot(
    organization: OrgSnapshotContext,
    snapshotDate: Date = previousCalendarMonthSnapshotDate(),
  ): Promise<void> {
    if (!this.isEnabled()) return

    const dateOnly = parseUtcDateOnly(formatUtcDateOnly(snapshotDate))!
    const existing = await this.prisma.socialListeningSnapshot.findUnique({
      where: {
        organizationId_snapshotDate: {
          organizationId: organization.id,
          snapshotDate: dateOnly,
        },
      },
      select: { id: true },
    })
    if (existing) return

    const { periodStart, periodEnd } = calendarMonthPeriodForSnapshot(snapshotDate)
    const { data, source } = await this.brand24.fetchAnalytics(
      organization.id,
      organization.brand24ProjectId,
      { periodStart, periodEnd },
    )

    const mentionCount = data.sentimentSummary.reduce((sum, s) => sum + s.value, 0)
    this.logger.log(
      `Snapshot captured org=${organization.id} date=${formatUtcDateOnly(dateOnly)} source=${source} mentions=${mentionCount}`,
    )

    await this.prisma.socialListeningSnapshot.upsert({
      where: {
        organizationId_snapshotDate: {
          organizationId: organization.id,
          snapshotDate: dateOnly,
        },
      },
      create: {
        organizationId: organization.id,
        snapshotDate: dateOnly,
        periodStart,
        periodEnd,
        source,
        brand24ProjectId: organization.brand24ProjectId,
        payload: data as unknown as Prisma.InputJsonValue,
      },
      update: {
        periodStart,
        periodEnd,
        source,
        brand24ProjectId: organization.brand24ProjectId,
        payload: data as unknown as Prisma.InputJsonValue,
      },
    })
  }

  async getSnapshot(
    organization: OrgSnapshotContext,
    date?: Date,
  ): Promise<SocialListeningAnalyticsResponse | null> {
    const row = date
      ? await this.prisma.socialListeningSnapshot.findUnique({
          where: {
            organizationId_snapshotDate: {
              organizationId: organization.id,
              snapshotDate: parseUtcDateOnly(formatUtcDateOnly(date))!,
            },
          },
        })
      : await this.prisma.socialListeningSnapshot.findFirst({
          where: { organizationId: organization.id },
          orderBy: { snapshotDate: 'desc' },
        })

    if (!row) return null

    return this.rowToResponse(organization, row)
  }

  async listSnapshotDates(
    organizationId: string,
    limit = 90,
    organizationName?: string,
  ): Promise<SocialListeningSnapshotDatesResponse> {
    const rows = await this.prisma.socialListeningSnapshot.findMany({
      where: { organizationId },
      orderBy: { snapshotDate: 'desc' },
      take: limit,
      select: {
        snapshotDate: true,
        periodStart: true,
        periodEnd: true,
        source: true,
        payload: true,
      },
    })

    const snapshots = rows.map((r) => ({
      date: formatUtcDateOnly(r.snapshotDate),
      periodStart: r.periodStart.toISOString(),
      periodEnd: r.periodEnd.toISOString(),
      source: (r.source === 'brand24' ? 'brand24' : 'org_mock') as
        | 'brand24'
        | 'org_mock',
      totalMentions: totalMentionsFromPayload(r.payload),
    }))

    return {
      ok: true,
      organizationId,
      organizationName,
      dates: snapshots.map((s) => s.date),
      snapshots,
    }
  }

  async compare(
    organization: OrgSnapshotContext,
    baselineDate: Date,
    currentDate?: Date,
  ): Promise<SocialListeningCompareResponse> {
    const baselineRow = await this.prisma.socialListeningSnapshot.findUnique({
      where: {
        organizationId_snapshotDate: {
          organizationId: organization.id,
          snapshotDate: parseUtcDateOnly(formatUtcDateOnly(baselineDate))!,
        },
      },
    })
    if (!baselineRow) {
      throw new NotFoundException(
        `No snapshot for ${formatUtcDateOnly(baselineDate)}`,
      )
    }

    const currentRow = currentDate
      ? await this.prisma.socialListeningSnapshot.findUnique({
          where: {
            organizationId_snapshotDate: {
              organizationId: organization.id,
              snapshotDate: parseUtcDateOnly(formatUtcDateOnly(currentDate))!,
            },
          },
        })
      : await this.prisma.socialListeningSnapshot.findFirst({
          where: { organizationId: organization.id },
          orderBy: { snapshotDate: 'desc' },
        })

    if (!currentRow) {
      throw new NotFoundException('No current snapshot available')
    }

    const baseline = this.rowToResponse(organization, baselineRow)
    const current = this.rowToResponse(organization, currentRow)

    return {
      ok: true,
      baseline: {
        date: formatUtcDateOnly(baselineRow.snapshotDate),
        data: baseline.data,
        meta: baseline.meta,
      },
      current: {
        date: formatUtcDateOnly(currentRow.snapshotDate),
        data: current.data,
        meta: current.meta,
      },
      deltas: this.computeDeltas(baseline.data, current.data),
    }
  }

  isSnapshotFresh(createdAt: Date): boolean {
    const maxMs = this.maxAgeHours() * 60 * 60 * 1000
    return Date.now() - createdAt.getTime() < maxMs
  }

  async pruneRetention(): Promise<number> {
    if (!this.isEnabled()) return 0

    const cutoff = new Date()
    cutoff.setUTCDate(cutoff.getUTCDate() - this.retentionDays())
    const cutoffDate = parseUtcDateOnly(formatUtcDateOnly(cutoff))!

    const result = await this.prisma.socialListeningSnapshot.deleteMany({
      where: {
        snapshotDate: { lt: cutoffDate },
      },
    })

    if (result.count > 0) {
      this.logger.log(`Pruned ${result.count} social listening snapshot(s)`)
    }

    return result.count
  }

  async listSubscriberOrganizationIds(): Promise<string[]> {
    const orgs = await this.prisma.organization.findMany({
      where: { isSocialListeningSubscriber: true },
      select: { id: true },
    })
    return orgs.map((o) => o.id)
  }

  async captureAllSubscriberSnapshots(): Promise<void> {
    if (!this.isEnabled()) return

    const snapshotDate = previousCalendarMonthSnapshotDate()
    const orgs = await this.prisma.organization.findMany({
      where: { isSocialListeningSubscriber: true },
      select: { id: true, brand24ProjectId: true },
    })

    for (const org of orgs) {
      try {
        await this.captureSnapshot(org, snapshotDate)
      } catch (err) {
        this.logger.warn(
          `Snapshot failed for org ${org.id}: ${err instanceof Error ? err.message : err}`,
        )
      }
    }
  }

  private rowToResponse(
    organization: OrgSnapshotContext,
    row: {
      snapshotDate: Date
      periodStart: Date
      periodEnd: Date
      source: string
      brand24ProjectId: string | null
      payload: unknown
      createdAt: Date
    },
  ): SocialListeningAnalyticsResponse {
    const meta: SocialListeningAnalyticsMeta = {
      source: row.source === 'brand24' ? 'brand24' : 'org_mock',
      organizationId: organization.id,
      brand24ProjectId: row.brand24ProjectId ?? organization.brand24ProjectId,
      fetchedAt: row.createdAt.toISOString(),
      snapshotDate: formatUtcDateOnly(row.snapshotDate),
      periodStart: row.periodStart.toISOString(),
      periodEnd: row.periodEnd.toISOString(),
      fromSnapshot: true,
    }

    return {
      ok: true,
      data: this.ensureCompletePayload(
        organization,
        row.snapshotDate,
        row.payload,
      ),
      meta,
    }
  }

  private ensureCompletePayload(
    organization: OrgSnapshotContext,
    snapshotDate: Date,
    payload: unknown,
  ): SocialListeningAnalytics {
    const partial = (payload ?? {}) as Partial<SocialListeningAnalytics>
    const fallback = buildOrgScopedMockAnalytics(
      organization.id,
      organization.brand24ProjectId,
      { periodEnd: snapshotDate },
    )

    return {
      sentimentSummary: partial.sentimentSummary?.length
        ? partial.sentimentSummary
        : fallback.sentimentSummary,
      sentimentOverTime: partial.sentimentOverTime?.length
        ? partial.sentimentOverTime
        : fallback.sentimentOverTime,
      sourceBreakdown:
        Array.isArray(partial.sourceBreakdown) &&
        partial.sourceBreakdown.length > 0
          ? partial.sourceBreakdown
          : fallback.sourceBreakdown,
      reachVsEngagement: partial.reachVsEngagement?.length
        ? partial.reachVsEngagement
        : fallback.reachVsEngagement,
      mentionMatrix: partial.mentionMatrix?.length
        ? partial.mentionMatrix
        : fallback.mentionMatrix,
    }
  }

  private computeDeltas(
    baseline: SocialListeningAnalytics,
    current: SocialListeningAnalytics,
  ): SocialListeningCompareResponse['deltas'] {
    const baseTotal = this.totalMentions(baseline)
    const currTotal = this.totalMentions(current)

    return {
      totalMentions: this.metricDelta(baseTotal, currTotal),
      positive: this.metricDelta(
        this.sentimentValue(baseline, 'positive'),
        this.sentimentValue(current, 'positive'),
      ),
      neutral: this.metricDelta(
        this.sentimentValue(baseline, 'neutral'),
        this.sentimentValue(current, 'neutral'),
      ),
      negative: this.metricDelta(
        this.sentimentValue(baseline, 'negative'),
        this.sentimentValue(current, 'negative'),
      ),
    }
  }

  private totalMentions(data: SocialListeningAnalytics): number {
    return data.sentimentSummary.reduce((sum, s) => sum + s.value, 0)
  }

  private sentimentValue(
    data: SocialListeningAnalytics,
    id: SentimentId,
  ): number {
    return data.sentimentSummary.find((s) => s.id === id)?.value ?? 0
  }

  private metricDelta(baseline: number, current: number): SocialListeningMetricDelta {
    const change = current - baseline
    const percentChange =
      baseline === 0 ? (current === 0 ? 0 : null) : (change / baseline) * 100
    return { baseline, current, change, percentChange }
  }
}
