/** Sentiment colors — CoCreate brand tints (see sentiment-meta for gradients) */
export const SENTIMENT_COLORS = {
  positive: '#406eb5',
  neutral: '#a8b8e8',
  negative: '#d94f4f',
} as const

export type SentimentId = keyof typeof SENTIMENT_COLORS

export type { SocialPlatformId } from './platform-meta'

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

export type SourceBreakdownRow = {
  platformId: string
  mentions: number
}

export type LineChartPoint = {
  x: string
  y: number
}

export type ReachEngagementSeries = {
  id: string
  data: LineChartPoint[]
}

export type HeatmapCell = {
  x: string
  y: number
}

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
