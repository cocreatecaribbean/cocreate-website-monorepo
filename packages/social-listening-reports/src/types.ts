export type SentimentId = 'positive' | 'neutral' | 'negative'

export type SentimentSlice = {
  id: SentimentId
  label: string
  value: number
  color: string
}

export type SourceBreakdownRow = {
  platformId: string
  mentions: number
}

export type SentimentOverTimeRow = {
  date: string
  positive: number
  neutral: number
  negative: number
}

export type SocialListeningAnalytics = {
  sentimentSummary: SentimentSlice[]
  sentimentOverTime: SentimentOverTimeRow[]
  sourceBreakdown: SourceBreakdownRow[]
  reachVsEngagement: { id: string; data: { x: string; y: number }[] }[]
  mentionMatrix: { id: string; data: { x: string; y: number }[] }[]
}

export type SocialListeningAnalyticsMeta = {
  source: 'brand24' | 'org_mock'
  organizationId: string
  brand24ProjectId: string | null
  fetchedAt: string
  snapshotDate?: string
  periodStart?: string
  periodEnd?: string
  fromSnapshot?: boolean
}

export type SocialListeningMetricDelta = {
  baseline: number
  current: number
  change: number
  percentChange: number | null
}

export type ReportOrganization = {
  name: string
  slug?: string
  logoUrl?: string | null
}

export type ReportSnapshotBundle = {
  data: SocialListeningAnalytics
  meta: SocialListeningAnalyticsMeta
}

export type ReportCompareBundle = {
  baseline: ReportSnapshotBundle & { date: string }
  current: ReportSnapshotBundle & { date: string }
  deltas: {
    totalMentions: SocialListeningMetricDelta
    positive: SocialListeningMetricDelta
    neutral: SocialListeningMetricDelta
    negative: SocialListeningMetricDelta
  }
}

export type ReportRenderContext = {
  organization: ReportOrganization
  snapshot: ReportSnapshotBundle
  compare?: ReportCompareBundle
  generatedAt: string
}

export type ReportTemplateId = 'executive-summary' | 'full-dashboard' | 'period-compare'

export type ReportTemplateMeta = {
  id: ReportTemplateId
  label: string
  description: string
  pageHint: string
  supportsCompare: boolean
}
