/** API social-listening types — wire shapes from contracts; runtime constants stay local. */

import type {
  SocialListeningAnalytics as SocialListeningAnalyticsWire,
  SocialListeningAnalyticsMeta,
  SocialListeningComparePayload,
  SocialListeningHeatmapCell,
  SocialListeningLineChartPoint,
  SocialListeningMentionMatrixRow,
  SocialListeningMetricDelta,
  SocialListeningReachEngagementSeries,
  SocialListeningSentimentId,
  SocialListeningSentimentOverTimeRow,
  SocialListeningSentimentSlice,
  SocialListeningSourceBreakdownRow,
} from '@cocreate/api-contracts/v1/social-listening'

/** Sentiment colors — CoCreate brand tints (API-local; not imported from frontend packages). */
export const SENTIMENT_COLORS = {
  positive: '#406eb5',
  neutral: '#a8b8e8',
  negative: '#d94f4f',
} as const

export type SentimentId = SocialListeningSentimentId

export type SentimentSlice = SocialListeningSentimentSlice

export type SentimentOverTimeRow = SocialListeningSentimentOverTimeRow

export type SocialPlatformId =
  | 'x'
  | 'tiktok'
  | 'reddit'
  | 'instagram'
  | 'facebook'
  | 'web'
  | 'forums'

export type SourceBreakdownRow = SocialListeningSourceBreakdownRow & {
  platformId: SocialPlatformId
}

export type LineChartPoint = SocialListeningLineChartPoint

export type ReachEngagementSeries = SocialListeningReachEngagementSeries

export type HeatmapCell = SocialListeningHeatmapCell

export type MentionMatrixRow = SocialListeningMentionMatrixRow

export type SocialListeningAnalytics = Omit<
  SocialListeningAnalyticsWire,
  'sourceBreakdown'
> & {
  sourceBreakdown: SourceBreakdownRow[]
}

export type { SocialListeningAnalyticsMeta, SocialListeningMetricDelta }

export type SocialListeningAnalyticsResponse = {
  ok: true
  data: SocialListeningAnalytics
  meta: SocialListeningAnalyticsMeta
}

export type SocialListeningSnapshotDatesResponse = {
  ok: true
  dates: string[]
}

export type SocialListeningCompareResponse = {
  ok: true
} & SocialListeningComparePayload
