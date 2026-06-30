import { z } from 'zod'
import { isoDateTimeString } from '../../zod/common'

export const SocialListeningSentimentIdSchema = z.enum([
  'positive',
  'neutral',
  'negative',
])
export type SocialListeningSentimentId = z.infer<typeof SocialListeningSentimentIdSchema>

export const SocialListeningSentimentSliceSchema = z.object({
  id: SocialListeningSentimentIdSchema,
  label: z.string(),
  value: z.number(),
  color: z.string(),
})
export type SocialListeningSentimentSlice = z.infer<
  typeof SocialListeningSentimentSliceSchema
>

export const SocialListeningSentimentOverTimeRowSchema = z.object({
  date: z.string(),
  positive: z.number(),
  neutral: z.number(),
  negative: z.number(),
})
export type SocialListeningSentimentOverTimeRow = z.infer<
  typeof SocialListeningSentimentOverTimeRowSchema
>

export const SocialListeningSourceBreakdownRowSchema = z.object({
  platformId: z.string(),
  mentions: z.number(),
})
export type SocialListeningSourceBreakdownRow = z.infer<
  typeof SocialListeningSourceBreakdownRowSchema
>

export const SocialListeningLineChartPointSchema = z.object({
  x: z.string(),
  y: z.number(),
})
export type SocialListeningLineChartPoint = z.infer<
  typeof SocialListeningLineChartPointSchema
>

export const SocialListeningReachEngagementSeriesSchema = z.object({
  id: z.string(),
  data: z.array(SocialListeningLineChartPointSchema),
})
export type SocialListeningReachEngagementSeries = z.infer<
  typeof SocialListeningReachEngagementSeriesSchema
>

export const SocialListeningHeatmapCellSchema = z.object({
  x: z.string(),
  y: z.number(),
})
export type SocialListeningHeatmapCell = z.infer<typeof SocialListeningHeatmapCellSchema>

export const SocialListeningMentionMatrixRowSchema = z.object({
  id: z.string(),
  data: z.array(SocialListeningHeatmapCellSchema),
})
export type SocialListeningMentionMatrixRow = z.infer<
  typeof SocialListeningMentionMatrixRowSchema
>

export const SocialListeningAnalyticsSchema = z.object({
  sentimentSummary: z.array(SocialListeningSentimentSliceSchema),
  sentimentOverTime: z.array(SocialListeningSentimentOverTimeRowSchema),
  sourceBreakdown: z.array(SocialListeningSourceBreakdownRowSchema),
  reachVsEngagement: z.array(SocialListeningReachEngagementSeriesSchema),
  mentionMatrix: z.array(SocialListeningMentionMatrixRowSchema),
})
export type SocialListeningAnalytics = z.infer<typeof SocialListeningAnalyticsSchema>

export const SocialListeningAnalyticsMetaSchema = z.object({
  source: z.enum(['brand24', 'org_mock']),
  organizationId: z.string(),
  brand24ProjectId: z.string().nullable(),
  fetchedAt: isoDateTimeString,
  snapshotDate: z.string().optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  fromSnapshot: z.boolean().optional(),
})
export type SocialListeningAnalyticsMeta = z.infer<
  typeof SocialListeningAnalyticsMetaSchema
>

export const SocialListeningAnalyticsPayloadSchema = z.object({
  data: SocialListeningAnalyticsSchema,
  meta: SocialListeningAnalyticsMetaSchema,
})
export type SocialListeningAnalyticsPayload = z.infer<
  typeof SocialListeningAnalyticsPayloadSchema
>

export const SocialListeningMetricDeltaSchema = z.object({
  baseline: z.number(),
  current: z.number(),
  change: z.number(),
  percentChange: z.number().nullable(),
})
export type SocialListeningMetricDelta = z.infer<typeof SocialListeningMetricDeltaSchema>

export const SocialListeningComparePayloadSchema = z.object({
  baseline: z.object({
    date: z.string(),
    data: SocialListeningAnalyticsSchema,
    meta: SocialListeningAnalyticsMetaSchema,
  }),
  current: z.object({
    date: z.string(),
    data: SocialListeningAnalyticsSchema,
    meta: SocialListeningAnalyticsMetaSchema,
  }),
  deltas: z.object({
    totalMentions: SocialListeningMetricDeltaSchema,
    positive: SocialListeningMetricDeltaSchema,
    neutral: SocialListeningMetricDeltaSchema,
    negative: SocialListeningMetricDeltaSchema,
  }),
})
export type SocialListeningComparePayload = z.infer<
  typeof SocialListeningComparePayloadSchema
>

export const SocialListeningReportTemplateIdSchema = z.enum([
  'executive-summary',
  'full-dashboard',
  'period-compare',
])
export type SocialListeningReportTemplateId = z.infer<
  typeof SocialListeningReportTemplateIdSchema
>

export const SocialListeningReportTemplateMetaSchema = z.object({
  id: SocialListeningReportTemplateIdSchema,
  label: z.string(),
  description: z.string(),
  pageHint: z.string(),
  supportsCompare: z.boolean(),
})
export type SocialListeningReportTemplateMeta = z.infer<
  typeof SocialListeningReportTemplateMetaSchema
>
