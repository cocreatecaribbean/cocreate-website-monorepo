'use client'

import MentionHeatmapChart from '@/components/social-listening/charts/mention-heatmap-chart'
import ReachEngagementLineChart from '@/components/social-listening/charts/reach-engagement-line-chart'
import SentimentPieChart from '@/components/social-listening/charts/sentiment-pie-chart'
import SentimentStreamChart from '@/components/social-listening/charts/sentiment-stream-chart'
import SourceBarChart from '@/components/social-listening/charts/source-bar-chart'
import ChartCard from '@/components/social-listening/chart-card'
import SentimentKpiStrip from '@/components/social-listening/sentiment-kpi-strip'
import type { SocialListeningAnalytics } from '@/lib/social-listening/types'

type SocialListeningDashboardProps = {
  data: SocialListeningAnalytics
  metaSource?: 'brand24' | 'org_mock'
}

export default function SocialListeningDashboard({
  data,
  metaSource = 'org_mock',
}: SocialListeningDashboardProps) {
  return (
    <div className="space-y-6">
      <SentimentKpiStrip data={data} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-4">
          <ChartCard
            title="Sentiment breakdown"
            description="Share of positive, neutral, and negative mentions"
            delayClass="portal-animate-in-delay-1"
          >
            <SentimentPieChart data={data.sentimentSummary} />
          </ChartCard>
        </div>
        <div className="lg:col-span-8">
          <ChartCard
            title="Sentiment over time"
            description="Daily mention volume by sentiment"
            accent
            compact
            delayClass="portal-animate-in-delay-2"
          >
            <SentimentStreamChart data={data.sentimentOverTime} />
          </ChartCard>
        </div>

        <div className="lg:col-span-12">
          <ChartCard
            title="Mentions by platform"
            description="Where your brand is being discussed — each channel has its own gradient"
            delayClass="portal-animate-in-delay-3"
          >
            <SourceBarChart data={data.sourceBreakdown} />
          </ChartCard>
        </div>

        <div className="lg:col-span-6">
          <ChartCard
            title="Reach vs engagement"
            description="Weekly reach (thousands) and engagement volume"
            delayClass="portal-animate-in-delay-4"
          >
            <ReachEngagementLineChart data={data.reachVsEngagement} />
          </ChartCard>
        </div>
        <div className="lg:col-span-6">
          <ChartCard
            title="Mention activity"
            description="Volume by day and time block"
            delayClass="portal-animate-in-delay-5"
          >
            <MentionHeatmapChart data={data.mentionMatrix} />
          </ChartCard>
        </div>
      </div>

      <p className="portal-animate-in portal-animate-in-delay-6 text-center text-xs tracking-wide text-slate-400 uppercase">
        {metaSource === 'brand24'
          ? 'Live Brand24 data'
          : 'Sample data · Brand24 data mockup instead of Awario because API is more robust! · Unique per client org'}
      </p>
    </div>
  )
}
