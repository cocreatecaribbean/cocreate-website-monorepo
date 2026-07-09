'use client'

import { useMemo, type ReactNode } from 'react'
import MentionHeatmapChart from './charts/mention-heatmap-chart'
import MonthlyMentionsTrendChart from './charts/monthly-mentions-trend-chart'
import ReachEngagementLineChart from './charts/reach-engagement-line-chart'
import SentimentPieChart from './charts/sentiment-pie-chart'
import SentimentStreamChart from './charts/sentiment-stream-chart'
import ChartCard from './chart-card'
import MentionsByPlatformBlock from './mentions-by-platform-block'
import SocialListeningReportsPanel from './social-listening-reports-panel'
import SocialListeningSetupPanel from './social-listening-setup-panel'
import SocialListeningSectionPlaceholder from './social-listening-section-placeholder'
import SentimentKpiStrip from './sentiment-kpi-strip'
import type { SocialListeningComparePayload } from '@cocreate/api-contracts/v1/social-listening'
import {
  buildMonthlyChartViews,
  buildMonthlyTrendPoints,
  computePlatformMentionDeltas,
  formatWeeklyWithinMonthDescription,
} from '@cocreate/social-listening/core'
import type { SocialListeningViewId } from '@cocreate/social-listening/data-source'
import type { SocialListeningSnapshotDateEntry } from '@cocreate/social-listening/data-source'
import type { SocialListeningAnalytics } from '@cocreate/social-listening/core'
import { Quote } from 'lucide-react'

type SocialListeningDashboardProps = {
  data: SocialListeningAnalytics
  activeView: SocialListeningViewId
  settingsOpen?: boolean
  metaSource?: 'brand24' | 'org_mock'
  periodStart?: string
  periodEnd?: string
  compareDeltas?: SocialListeningComparePayload['deltas'] | null
  compareBaselineDate?: string
  compareCurrentDate?: string
  comparePayload?: SocialListeningComparePayload | null
  snapshotDates?: string[]
  snapshots?: SocialListeningSnapshotDateEntry[]
  onSetupComplete?: () => void
  showSetup?: boolean
  renderSettingsPanel?: () => ReactNode
}

export default function SocialListeningDashboard({
  data,
  activeView,
  settingsOpen = false,
  metaSource = 'org_mock',
  periodStart,
  periodEnd,
  compareDeltas = null,
  compareBaselineDate,
  compareCurrentDate,
  comparePayload = null,
  snapshotDates = [],
  snapshots = [],
  onSetupComplete,
  showSetup = true,
  renderSettingsPanel,
}: SocialListeningDashboardProps) {
  const chartData = useMemo(
    () =>
      buildMonthlyChartViews(data, {
        periodStart,
        periodEnd,
        snapshotDate: compareCurrentDate,
      }),
    [compareCurrentDate, data, periodEnd, periodStart],
  )

  const monthlyTrend = useMemo(
    () => buildMonthlyTrendPoints(snapshots),
    [snapshots],
  )

  const platformMentionDeltas = useMemo(() => {
    if (!comparePayload) return null
    return computePlatformMentionDeltas(
      comparePayload.baseline.data.sourceBreakdown,
      comparePayload.current.data.sourceBreakdown,
    )
  }, [comparePayload])

  const platformCompareActive =
    Boolean(platformMentionDeltas?.length) &&
    Boolean(compareBaselineDate) &&
    Boolean(compareCurrentDate)

  return (
    <div key={activeView} className="portal-sl-region space-y-6">
      {settingsOpen && renderSettingsPanel ? renderSettingsPanel() : null}
      {!settingsOpen && compareDeltas && compareBaselineDate && compareCurrentDate ? (
        <p className="text-center text-xs portal-sl-secondary">
          Comparing {compareCurrentDate} to baseline {compareBaselineDate}
        </p>
      ) : null}
      {!settingsOpen && activeView === 'summary' ? (
        <SummaryView
          data={data}
          chartData={chartData}
          monthlyTrend={monthlyTrend}
          periodStart={periodStart}
          periodEnd={periodEnd}
          compareDeltas={compareDeltas}
          platformMentionDeltas={platformMentionDeltas}
          compareBaselineDate={compareBaselineDate}
          compareCurrentDate={compareCurrentDate}
          platformCompareActive={platformCompareActive}
        />
      ) : null}
      {!settingsOpen && activeView === 'mentions' ? (
        <MentionsView
          chartData={chartData}
          periodStart={periodStart}
          periodEnd={periodEnd}
        />
      ) : null}
      {!settingsOpen && activeView === 'analysis' ? (
        <AnalysisView
          data={data}
          chartData={chartData}
          periodStart={periodStart}
          periodEnd={periodEnd}
        />
      ) : null}
      {!settingsOpen && activeView === 'sources' ? (
        <SourcesView
          data={data}
          platformMentionDeltas={platformMentionDeltas}
          compareBaselineDate={compareBaselineDate}
          compareCurrentDate={compareCurrentDate}
          platformCompareActive={platformCompareActive}
        />
      ) : null}
      {!settingsOpen && activeView === 'quotes' ? (
        <SocialListeningSectionPlaceholder
          title="Quotes"
          description="Preview — verbatim posts from Brand24 will appear here after live ingestion is enabled (Growth+)."
          icon={Quote}
        />
      ) : null}
      <div className={activeView === 'reports' && !settingsOpen ? undefined : 'hidden'} aria-hidden={activeView !== 'reports' || settingsOpen}>
        {!settingsOpen ? (
          <SocialListeningReportsPanel snapshotDates={snapshotDates} />
        ) : null}
      </div>
      {!settingsOpen && activeView === 'setup' && showSetup ? (
        <SocialListeningSetupPanel onComplete={onSetupComplete} />
      ) : null}
    </div>
  )
}

function SummaryView({
  data,
  chartData,
  monthlyTrend,
  periodStart,
  periodEnd,
  compareDeltas,
  platformMentionDeltas,
  compareBaselineDate,
  compareCurrentDate,
  platformCompareActive,
}: {
  data: SocialListeningAnalytics
  chartData: SocialListeningAnalytics
  monthlyTrend: ReturnType<typeof buildMonthlyTrendPoints>
  periodStart?: string
  periodEnd?: string
  compareDeltas?: SocialListeningComparePayload['deltas'] | null
  platformMentionDeltas: ReturnType<typeof computePlatformMentionDeltas> | null
  compareBaselineDate?: string
  compareCurrentDate?: string
  platformCompareActive: boolean
}) {
  return (
    <>
      <SentimentKpiStrip data={data} deltas={compareDeltas} />
      {monthlyTrend.length >= 2 ? (
        <ChartCard
          title="Monthly mention trend"
          description="One bar per calendar month from your saved snapshots"
          delayClass="portal-animate-in"
        >
          <MonthlyMentionsTrendChart points={monthlyTrend} />
        </ChartCard>
      ) : null}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-5">
          <ChartCard
            title="Sentiment breakdown"
            description="Share of positive, neutral, and negative mentions"
            delayClass="portal-animate-in-delay-1"
          >
            <SentimentPieChart data={data.sentimentSummary} />
          </ChartCard>
        </div>
        <div className="lg:col-span-7">
          <MentionsByPlatformBlock
            data={data}
            platformMentionDeltas={platformMentionDeltas}
            compareBaselineDate={compareBaselineDate}
            compareCurrentDate={compareCurrentDate}
            platformCompareActive={platformCompareActive}
            delayClass="portal-animate-in-delay-2"
          />
        </div>
      </div>
      <ChartCard
        title="Weekly sentiment trend"
        description={formatWeeklyWithinMonthDescription(
          periodStart,
          'Sentiment mix by week within this month',
        )}
        compact
        delayClass="portal-animate-in-delay-3"
      >
        <SentimentStreamChart
          data={chartData.sentimentOverTime}
          periodStart={periodStart}
          periodEnd={periodEnd}
        />
      </ChartCard>
    </>
  )
}

function MentionsView({
  chartData,
  periodStart,
  periodEnd,
}: {
  chartData: SocialListeningAnalytics
  periodStart?: string
  periodEnd?: string
}) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
      <div className="lg:col-span-12">
        <ChartCard
          title="Sentiment over time"
          description={formatWeeklyWithinMonthDescription(
            periodStart,
            'Weekly mention mix within this month',
          )}
          accent
          compact
          delayClass="portal-animate-in"
        >
          <SentimentStreamChart
            data={chartData.sentimentOverTime}
            periodStart={periodStart}
            periodEnd={periodEnd}
          />
        </ChartCard>
      </div>
      <div className="lg:col-span-12">
        <ChartCard
          title="Mention activity"
          description={formatWeeklyWithinMonthDescription(
            periodStart,
            'Weekly activity by time of day',
          )}
          delayClass="portal-animate-in-delay-1"
        >
          <MentionHeatmapChart data={chartData.mentionMatrix} />
        </ChartCard>
      </div>
    </div>
  )
}

function AnalysisView({
  data,
  chartData,
  periodStart,
  periodEnd,
}: {
  data: SocialListeningAnalytics
  chartData: SocialListeningAnalytics
  periodStart?: string
  periodEnd?: string
}) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
      <div className="lg:col-span-12">
        <ChartCard
          title="Reach vs engagement"
          description={formatWeeklyWithinMonthDescription(
            periodStart,
            'Reach and engagement by week within this month',
          )}
          delayClass="portal-animate-in"
        >
          <ReachEngagementLineChart data={chartData.reachVsEngagement} />
        </ChartCard>
      </div>
      <div className="lg:col-span-6">
        <ChartCard
          title="Sentiment breakdown"
          description="Current sentiment mix"
          delayClass="portal-animate-in-delay-1"
        >
          <SentimentPieChart data={data.sentimentSummary} />
        </ChartCard>
      </div>
      <div className="lg:col-span-6">
        <ChartCard
          title="Sentiment over time"
          description={formatWeeklyWithinMonthDescription(
            periodStart,
            'Weekly sentiment trend',
          )}
          compact
          delayClass="portal-animate-in-delay-2"
        >
          <SentimentStreamChart
            data={chartData.sentimentOverTime}
            periodStart={periodStart}
            periodEnd={periodEnd}
          />
        </ChartCard>
      </div>
    </div>
  )
}

function SourcesView({
  data,
  platformMentionDeltas,
  compareBaselineDate,
  compareCurrentDate,
  platformCompareActive,
}: {
  data: SocialListeningAnalytics
  platformMentionDeltas: ReturnType<typeof computePlatformMentionDeltas> | null
  compareBaselineDate?: string
  compareCurrentDate?: string
  platformCompareActive: boolean
}) {
  return (
    <MentionsByPlatformBlock
      data={data}
      platformMentionDeltas={platformMentionDeltas}
      compareBaselineDate={compareBaselineDate}
      compareCurrentDate={compareCurrentDate}
      platformCompareActive={platformCompareActive}
      delayClass="portal-animate-in"
      description="Where your brand is being discussed — each channel has its own gradient"
    />
  )
}
