/** API response shape — mirrors client-portal chart types */
export const SENTIMENT_COLORS = {
  positive: '#406eb5',
  neutral: '#a8b8e8',
  negative: '#d94f4f',
} as const

export type SentimentId = keyof typeof SENTIMENT_COLORS

export type SentimentSlice = {
  id: SentimentId
  label: string
  value: number
  color: string
}

export type SentimentOverTimeRow = {
  date: string
  positive: number
  neutral: number
  negative: number
}

export type SocialPlatformId =
  | 'x'
  | 'tiktok'
  | 'reddit'
  | 'instagram'
  | 'facebook'
  | 'web'
  | 'forums'

export type SourceBreakdownRow = {
  platformId: SocialPlatformId
  mentions: number
}

export type LineChartPoint = { x: string; y: number }

export type ReachEngagementSeries = {
  id: string
  data: LineChartPoint[]
}

export type HeatmapCell = { x: string; y: number }

export type MentionMatrixRow = {
  id: string
  data: HeatmapCell[]
}

export type SocialListeningAnalytics = {
  sentimentSummary: SentimentSlice[]
  sentimentOverTime: SentimentOverTimeRow[]
  sourceBreakdown: SourceBreakdownRow[]
  reachVsEngagement: ReachEngagementSeries[]
  mentionMatrix: MentionMatrixRow[]
}

export type SocialListeningAnalyticsMeta = {
  source: 'brand24' | 'org_mock'
  organizationId: string
  brand24ProjectId: string | null
  fetchedAt: string
}

export type SocialListeningAnalyticsResponse = {
  ok: true
  data: SocialListeningAnalytics
  meta: SocialListeningAnalyticsMeta
}
