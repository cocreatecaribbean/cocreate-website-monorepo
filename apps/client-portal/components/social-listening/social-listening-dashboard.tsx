'use client'

import { useMemo, type ReactNode } from 'react'
import MentionHeatmapChart from '@client-portal/components/social-listening/charts/mention-heatmap-chart'
import ReachEngagementLineChart from '@client-portal/components/social-listening/charts/reach-engagement-line-chart'
import SentimentPieChart from '@client-portal/components/social-listening/charts/sentiment-pie-chart'
import SentimentStreamChart from '@client-portal/components/social-listening/charts/sentiment-stream-chart'
import ChartCard from '@client-portal/components/social-listening/chart-card'
import MentionsByPlatformBlock from '@client-portal/components/social-listening/mentions-by-platform-block'
import SocialListeningReportsPanel from '@client-portal/components/social-listening/social-listening-reports-panel'
import SocialListeningSetupPanel from '@client-portal/components/social-listening/social-listening-setup-panel'
import SocialListeningSectionPlaceholder from '@client-portal/components/social-listening/social-listening-section-placeholder'
import SentimentKpiStrip from '@client-portal/components/social-listening/sentiment-kpi-strip'
import type { SocialListeningComparePayload } from '@client-portal/lib/social-listening/api-types'
import { computePlatformMentionDeltas } from '@client-portal/lib/social-listening/platform-mention-deltas'
import type { SocialListeningViewId } from '@client-portal/lib/social-listening/nav'
import type { SocialListeningAnalytics } from '@client-portal/lib/social-listening/types'
import { Quote } from 'lucide-react'

type SocialListeningDashboardProps = {
  data: SocialListeningAnalytics
  activeView: SocialListeningViewId
  settingsOpen?: boolean
  metaSource?: 'brand24' | 'org_mock'
  compareDeltas?: SocialListeningComparePayload['deltas'] | null
  compareBaselineDate?: string
  compareCurrentDate?: string
  comparePayload?: SocialListeningComparePayload | null
  onSetupComplete?: () => void
  showSetup?: boolean
  renderSettingsPanel?: () => ReactNode
}

export default function SocialListeningDashboard({
  data,
  activeView,
  settingsOpen = false,
  metaSource = 'org_mock',
  compareDeltas = null,
  compareBaselineDate,
  compareCurrentDate,
  comparePayload = null,
  onSetupComplete,
  showSetup = true,
  renderSettingsPanel,
}: SocialListeningDashboardProps) {
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
    <div className="portal-sl-region space-y-6">
      {settingsOpen && renderSettingsPanel ? renderSettingsPanel() : null}
      {!settingsOpen && compareDeltas && compareBaselineDate && compareCurrentDate ? (
        <p className="text-center text-xs portal-sl-secondary">
          Comparing {compareCurrentDate} to baseline {compareBaselineDate}
        </p>
      ) : null}
      {!settingsOpen && activeView === 'summary' ? (
        <SummaryView
          data={data}
          compareDeltas={compareDeltas}
          platformMentionDeltas={platformMentionDeltas}
          compareBaselineDate={compareBaselineDate}
          compareCurrentDate={compareCurrentDate}
          platformCompareActive={platformCompareActive}
        />
      ) : null}
      {!settingsOpen && activeView === 'mentions' ? <MentionsView data={data} /> : null}
      {!settingsOpen && activeView === 'analysis' ? <AnalysisView data={data} /> : null}
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
          description="Surface standout posts and verbatim snippets from across the web and social channels."
          icon={Quote}
        />
      ) : null}
      {!settingsOpen && activeView === 'reports' ? <SocialListeningReportsPanel /> : null}
      {!settingsOpen && activeView === 'setup' && showSetup ? (
        <SocialListeningSetupPanel onComplete={onSetupComplete} />
      ) : null}

      {!settingsOpen && activeView !== 'setup' ? (
      <p className="portal-animate-in text-center text-xs tracking-wide portal-sl-caption uppercase">
        {metaSource === 'brand24'
          ? 'Live Brand24 data'
          : 'Sample data · Brand24 data mockup instead of Awario because API is more robust! · Unique per client org'}
      </p>
      ) : null}
    </div>
  )
}

function SummaryView({
  data,
  compareDeltas,
  platformMentionDeltas,
  compareBaselineDate,
  compareCurrentDate,
  platformCompareActive,
}: {
  data: SocialListeningAnalytics
  compareDeltas?: SocialListeningComparePayload['deltas'] | null
  platformMentionDeltas: ReturnType<typeof computePlatformMentionDeltas> | null
  compareBaselineDate?: string
  compareCurrentDate?: string
  platformCompareActive: boolean
}) {
  return (
    <>
      <SentimentKpiStrip data={data} deltas={compareDeltas} />
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
    </>
  )
}

function MentionsView({ data }: { data: SocialListeningAnalytics }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
      <div className="lg:col-span-12">
        <ChartCard
          title="Sentiment over time"
          description="Daily mention volume by sentiment"
          accent
          compact
          delayClass="portal-animate-in"
        >
          <SentimentStreamChart data={data.sentimentOverTime} />
        </ChartCard>
      </div>
      <div className="lg:col-span-12">
        <ChartCard
          title="Mention activity"
          description="Volume by day and time block"
          delayClass="portal-animate-in-delay-1"
        >
          <MentionHeatmapChart data={data.mentionMatrix} />
        </ChartCard>
      </div>
    </div>
  )
}

function AnalysisView({ data }: { data: SocialListeningAnalytics }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
      <div className="lg:col-span-12">
        <ChartCard
          title="Reach vs engagement"
          description="Weekly reach (thousands) and engagement volume"
          delayClass="portal-animate-in"
        >
          <ReachEngagementLineChart data={data.reachVsEngagement} />
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
          description="Trend view"
          compact
          delayClass="portal-animate-in-delay-2"
        >
          <SentimentStreamChart data={data.sentimentOverTime} />
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

