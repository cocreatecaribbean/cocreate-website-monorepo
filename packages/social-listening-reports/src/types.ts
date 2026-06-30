export type {
  SocialListeningAnalytics,
  SocialListeningAnalyticsMeta,
  SocialListeningMetricDelta,
  SocialListeningSentimentId as SentimentId,
  SocialListeningSentimentSlice as SentimentSlice,
  SocialListeningSentimentOverTimeRow as SentimentOverTimeRow,
  SocialListeningSourceBreakdownRow as SourceBreakdownRow,
  SocialListeningReportTemplateId as ReportTemplateId,
  SocialListeningReportTemplateMeta as ReportTemplateMeta,
} from '@cocreate/api-contracts/v1/social-listening'

import type {
  SocialListeningAnalytics,
  SocialListeningAnalyticsMeta,
  SocialListeningComparePayload,
  SocialListeningMetricDelta,
} from '@cocreate/api-contracts/v1/social-listening'

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
  deltas: SocialListeningComparePayload['deltas']
}

export type ReportRenderContext = {
  organization: ReportOrganization
  snapshot: ReportSnapshotBundle
  compare?: ReportCompareBundle
  generatedAt: string
}
