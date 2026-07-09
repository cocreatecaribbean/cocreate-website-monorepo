import type { SocialListeningAnalytics } from '../types'
import { platformLabel } from '../platform-labels'

export function buildReportInsights(data: SocialListeningAnalytics): {
  headline: string
  detail: string
} {
  const total = data.sentimentSummary.reduce((s, row) => s + row.value, 0)
  const topSentiment = [...data.sentimentSummary].sort((a, b) => b.value - a.value)[0]
  const topPlatform = [...data.sourceBreakdown].sort((a, b) => b.mentions - a.mentions)[0]

  const sentimentPct =
    total > 0 && topSentiment
      ? Math.round((topSentiment.value / total) * 100)
      : 0

  const headline =
    topSentiment && total > 0
      ? `${sentimentPct}% of mentions are ${topSentiment.label.toLowerCase()}`
      : 'Mention volume captured for this reporting period'

  const detail =
    topPlatform && topPlatform.mentions > 0
      ? `${platformLabel(topPlatform.platformId)} leads with ${topPlatform.mentions.toLocaleString()} mentions across tracked channels.`
      : 'Platform breakdown will populate as listening sources accumulate data.'

  return { headline, detail }
}
