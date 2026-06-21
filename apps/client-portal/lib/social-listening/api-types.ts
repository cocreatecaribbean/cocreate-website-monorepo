import type { SocialListeningAnalytics } from '@client-portal/lib/social-listening/types'

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

export type SocialListeningAnalyticsPayload = {
  data: SocialListeningAnalytics
  meta: SocialListeningAnalyticsMeta
}

export type SocialListeningMetricDelta = {
  baseline: number
  current: number
  change: number
  percentChange: number | null
}

export type SocialListeningComparePayload = {
  baseline: { date: string; data: SocialListeningAnalytics; meta: SocialListeningAnalyticsMeta }
  current: { date: string; data: SocialListeningAnalytics; meta: SocialListeningAnalyticsMeta }
  deltas: {
    totalMentions: SocialListeningMetricDelta
    positive: SocialListeningMetricDelta
    neutral: SocialListeningMetricDelta
    negative: SocialListeningMetricDelta
  }
}
