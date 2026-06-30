"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialListeningReportTemplateMetaSchema = exports.SocialListeningReportTemplateIdSchema = exports.SocialListeningComparePayloadSchema = exports.SocialListeningMetricDeltaSchema = exports.SocialListeningAnalyticsPayloadSchema = exports.SocialListeningAnalyticsMetaSchema = exports.SocialListeningAnalyticsSchema = exports.SocialListeningMentionMatrixRowSchema = exports.SocialListeningHeatmapCellSchema = exports.SocialListeningReachEngagementSeriesSchema = exports.SocialListeningLineChartPointSchema = exports.SocialListeningSourceBreakdownRowSchema = exports.SocialListeningSentimentOverTimeRowSchema = exports.SocialListeningSentimentSliceSchema = exports.SocialListeningSentimentIdSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("../../zod/common");
exports.SocialListeningSentimentIdSchema = zod_1.z.enum([
    'positive',
    'neutral',
    'negative',
]);
exports.SocialListeningSentimentSliceSchema = zod_1.z.object({
    id: exports.SocialListeningSentimentIdSchema,
    label: zod_1.z.string(),
    value: zod_1.z.number(),
    color: zod_1.z.string(),
});
exports.SocialListeningSentimentOverTimeRowSchema = zod_1.z.object({
    date: zod_1.z.string(),
    positive: zod_1.z.number(),
    neutral: zod_1.z.number(),
    negative: zod_1.z.number(),
});
exports.SocialListeningSourceBreakdownRowSchema = zod_1.z.object({
    platformId: zod_1.z.string(),
    mentions: zod_1.z.number(),
});
exports.SocialListeningLineChartPointSchema = zod_1.z.object({
    x: zod_1.z.string(),
    y: zod_1.z.number(),
});
exports.SocialListeningReachEngagementSeriesSchema = zod_1.z.object({
    id: zod_1.z.string(),
    data: zod_1.z.array(exports.SocialListeningLineChartPointSchema),
});
exports.SocialListeningHeatmapCellSchema = zod_1.z.object({
    x: zod_1.z.string(),
    y: zod_1.z.number(),
});
exports.SocialListeningMentionMatrixRowSchema = zod_1.z.object({
    id: zod_1.z.string(),
    data: zod_1.z.array(exports.SocialListeningHeatmapCellSchema),
});
exports.SocialListeningAnalyticsSchema = zod_1.z.object({
    sentimentSummary: zod_1.z.array(exports.SocialListeningSentimentSliceSchema),
    sentimentOverTime: zod_1.z.array(exports.SocialListeningSentimentOverTimeRowSchema),
    sourceBreakdown: zod_1.z.array(exports.SocialListeningSourceBreakdownRowSchema),
    reachVsEngagement: zod_1.z.array(exports.SocialListeningReachEngagementSeriesSchema),
    mentionMatrix: zod_1.z.array(exports.SocialListeningMentionMatrixRowSchema),
});
exports.SocialListeningAnalyticsMetaSchema = zod_1.z.object({
    source: zod_1.z.enum(['brand24', 'org_mock']),
    organizationId: zod_1.z.string(),
    brand24ProjectId: zod_1.z.string().nullable(),
    fetchedAt: common_1.isoDateTimeString,
    snapshotDate: zod_1.z.string().optional(),
    periodStart: zod_1.z.string().optional(),
    periodEnd: zod_1.z.string().optional(),
    fromSnapshot: zod_1.z.boolean().optional(),
});
exports.SocialListeningAnalyticsPayloadSchema = zod_1.z.object({
    data: exports.SocialListeningAnalyticsSchema,
    meta: exports.SocialListeningAnalyticsMetaSchema,
});
exports.SocialListeningMetricDeltaSchema = zod_1.z.object({
    baseline: zod_1.z.number(),
    current: zod_1.z.number(),
    change: zod_1.z.number(),
    percentChange: zod_1.z.number().nullable(),
});
exports.SocialListeningComparePayloadSchema = zod_1.z.object({
    baseline: zod_1.z.object({
        date: zod_1.z.string(),
        data: exports.SocialListeningAnalyticsSchema,
        meta: exports.SocialListeningAnalyticsMetaSchema,
    }),
    current: zod_1.z.object({
        date: zod_1.z.string(),
        data: exports.SocialListeningAnalyticsSchema,
        meta: exports.SocialListeningAnalyticsMetaSchema,
    }),
    deltas: zod_1.z.object({
        totalMentions: exports.SocialListeningMetricDeltaSchema,
        positive: exports.SocialListeningMetricDeltaSchema,
        neutral: exports.SocialListeningMetricDeltaSchema,
        negative: exports.SocialListeningMetricDeltaSchema,
    }),
});
exports.SocialListeningReportTemplateIdSchema = zod_1.z.enum([
    'executive-summary',
    'full-dashboard',
    'period-compare',
]);
exports.SocialListeningReportTemplateMetaSchema = zod_1.z.object({
    id: exports.SocialListeningReportTemplateIdSchema,
    label: zod_1.z.string(),
    description: zod_1.z.string(),
    pageHint: zod_1.z.string(),
    supportsCompare: zod_1.z.boolean(),
});
