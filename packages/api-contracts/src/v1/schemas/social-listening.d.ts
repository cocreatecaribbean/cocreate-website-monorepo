import { z } from 'zod';
export declare const SocialListeningSentimentIdSchema: z.ZodEnum<{
    positive: "positive";
    neutral: "neutral";
    negative: "negative";
}>;
export type SocialListeningSentimentId = z.infer<typeof SocialListeningSentimentIdSchema>;
export declare const SocialListeningSentimentSliceSchema: z.ZodObject<{
    id: z.ZodEnum<{
        positive: "positive";
        neutral: "neutral";
        negative: "negative";
    }>;
    label: z.ZodString;
    value: z.ZodNumber;
    color: z.ZodString;
}, z.core.$strip>;
export type SocialListeningSentimentSlice = z.infer<typeof SocialListeningSentimentSliceSchema>;
export declare const SocialListeningSentimentOverTimeRowSchema: z.ZodObject<{
    date: z.ZodString;
    positive: z.ZodNumber;
    neutral: z.ZodNumber;
    negative: z.ZodNumber;
}, z.core.$strip>;
export type SocialListeningSentimentOverTimeRow = z.infer<typeof SocialListeningSentimentOverTimeRowSchema>;
export declare const SocialListeningSourceBreakdownRowSchema: z.ZodObject<{
    platformId: z.ZodString;
    mentions: z.ZodNumber;
}, z.core.$strip>;
export type SocialListeningSourceBreakdownRow = z.infer<typeof SocialListeningSourceBreakdownRowSchema>;
export declare const SocialListeningLineChartPointSchema: z.ZodObject<{
    x: z.ZodString;
    y: z.ZodNumber;
}, z.core.$strip>;
export type SocialListeningLineChartPoint = z.infer<typeof SocialListeningLineChartPointSchema>;
export declare const SocialListeningReachEngagementSeriesSchema: z.ZodObject<{
    id: z.ZodString;
    data: z.ZodArray<z.ZodObject<{
        x: z.ZodString;
        y: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type SocialListeningReachEngagementSeries = z.infer<typeof SocialListeningReachEngagementSeriesSchema>;
export declare const SocialListeningHeatmapCellSchema: z.ZodObject<{
    x: z.ZodString;
    y: z.ZodNumber;
}, z.core.$strip>;
export type SocialListeningHeatmapCell = z.infer<typeof SocialListeningHeatmapCellSchema>;
export declare const SocialListeningMentionMatrixRowSchema: z.ZodObject<{
    id: z.ZodString;
    data: z.ZodArray<z.ZodObject<{
        x: z.ZodString;
        y: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type SocialListeningMentionMatrixRow = z.infer<typeof SocialListeningMentionMatrixRowSchema>;
export declare const SocialListeningAnalyticsSchema: z.ZodObject<{
    sentimentSummary: z.ZodArray<z.ZodObject<{
        id: z.ZodEnum<{
            positive: "positive";
            neutral: "neutral";
            negative: "negative";
        }>;
        label: z.ZodString;
        value: z.ZodNumber;
        color: z.ZodString;
    }, z.core.$strip>>;
    sentimentOverTime: z.ZodArray<z.ZodObject<{
        date: z.ZodString;
        positive: z.ZodNumber;
        neutral: z.ZodNumber;
        negative: z.ZodNumber;
    }, z.core.$strip>>;
    sourceBreakdown: z.ZodArray<z.ZodObject<{
        platformId: z.ZodString;
        mentions: z.ZodNumber;
    }, z.core.$strip>>;
    reachVsEngagement: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        data: z.ZodArray<z.ZodObject<{
            x: z.ZodString;
            y: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    mentionMatrix: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        data: z.ZodArray<z.ZodObject<{
            x: z.ZodString;
            y: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type SocialListeningAnalytics = z.infer<typeof SocialListeningAnalyticsSchema>;
export declare const SocialListeningAnalyticsMetaSchema: z.ZodObject<{
    source: z.ZodEnum<{
        brand24: "brand24";
        org_mock: "org_mock";
    }>;
    organizationId: z.ZodString;
    brand24ProjectId: z.ZodNullable<z.ZodString>;
    fetchedAt: z.ZodString;
    snapshotDate: z.ZodOptional<z.ZodString>;
    periodStart: z.ZodOptional<z.ZodString>;
    periodEnd: z.ZodOptional<z.ZodString>;
    fromSnapshot: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type SocialListeningAnalyticsMeta = z.infer<typeof SocialListeningAnalyticsMetaSchema>;
export declare const SocialListeningAnalyticsPayloadSchema: z.ZodObject<{
    data: z.ZodObject<{
        sentimentSummary: z.ZodArray<z.ZodObject<{
            id: z.ZodEnum<{
                positive: "positive";
                neutral: "neutral";
                negative: "negative";
            }>;
            label: z.ZodString;
            value: z.ZodNumber;
            color: z.ZodString;
        }, z.core.$strip>>;
        sentimentOverTime: z.ZodArray<z.ZodObject<{
            date: z.ZodString;
            positive: z.ZodNumber;
            neutral: z.ZodNumber;
            negative: z.ZodNumber;
        }, z.core.$strip>>;
        sourceBreakdown: z.ZodArray<z.ZodObject<{
            platformId: z.ZodString;
            mentions: z.ZodNumber;
        }, z.core.$strip>>;
        reachVsEngagement: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            data: z.ZodArray<z.ZodObject<{
                x: z.ZodString;
                y: z.ZodNumber;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
        mentionMatrix: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            data: z.ZodArray<z.ZodObject<{
                x: z.ZodString;
                y: z.ZodNumber;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    meta: z.ZodObject<{
        source: z.ZodEnum<{
            brand24: "brand24";
            org_mock: "org_mock";
        }>;
        organizationId: z.ZodString;
        brand24ProjectId: z.ZodNullable<z.ZodString>;
        fetchedAt: z.ZodString;
        snapshotDate: z.ZodOptional<z.ZodString>;
        periodStart: z.ZodOptional<z.ZodString>;
        periodEnd: z.ZodOptional<z.ZodString>;
        fromSnapshot: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type SocialListeningAnalyticsPayload = z.infer<typeof SocialListeningAnalyticsPayloadSchema>;
export declare const SocialListeningMetricDeltaSchema: z.ZodObject<{
    baseline: z.ZodNumber;
    current: z.ZodNumber;
    change: z.ZodNumber;
    percentChange: z.ZodNullable<z.ZodNumber>;
}, z.core.$strip>;
export type SocialListeningMetricDelta = z.infer<typeof SocialListeningMetricDeltaSchema>;
export declare const SocialListeningComparePayloadSchema: z.ZodObject<{
    baseline: z.ZodObject<{
        date: z.ZodString;
        data: z.ZodObject<{
            sentimentSummary: z.ZodArray<z.ZodObject<{
                id: z.ZodEnum<{
                    positive: "positive";
                    neutral: "neutral";
                    negative: "negative";
                }>;
                label: z.ZodString;
                value: z.ZodNumber;
                color: z.ZodString;
            }, z.core.$strip>>;
            sentimentOverTime: z.ZodArray<z.ZodObject<{
                date: z.ZodString;
                positive: z.ZodNumber;
                neutral: z.ZodNumber;
                negative: z.ZodNumber;
            }, z.core.$strip>>;
            sourceBreakdown: z.ZodArray<z.ZodObject<{
                platformId: z.ZodString;
                mentions: z.ZodNumber;
            }, z.core.$strip>>;
            reachVsEngagement: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                data: z.ZodArray<z.ZodObject<{
                    x: z.ZodString;
                    y: z.ZodNumber;
                }, z.core.$strip>>;
            }, z.core.$strip>>;
            mentionMatrix: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                data: z.ZodArray<z.ZodObject<{
                    x: z.ZodString;
                    y: z.ZodNumber;
                }, z.core.$strip>>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        meta: z.ZodObject<{
            source: z.ZodEnum<{
                brand24: "brand24";
                org_mock: "org_mock";
            }>;
            organizationId: z.ZodString;
            brand24ProjectId: z.ZodNullable<z.ZodString>;
            fetchedAt: z.ZodString;
            snapshotDate: z.ZodOptional<z.ZodString>;
            periodStart: z.ZodOptional<z.ZodString>;
            periodEnd: z.ZodOptional<z.ZodString>;
            fromSnapshot: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    current: z.ZodObject<{
        date: z.ZodString;
        data: z.ZodObject<{
            sentimentSummary: z.ZodArray<z.ZodObject<{
                id: z.ZodEnum<{
                    positive: "positive";
                    neutral: "neutral";
                    negative: "negative";
                }>;
                label: z.ZodString;
                value: z.ZodNumber;
                color: z.ZodString;
            }, z.core.$strip>>;
            sentimentOverTime: z.ZodArray<z.ZodObject<{
                date: z.ZodString;
                positive: z.ZodNumber;
                neutral: z.ZodNumber;
                negative: z.ZodNumber;
            }, z.core.$strip>>;
            sourceBreakdown: z.ZodArray<z.ZodObject<{
                platformId: z.ZodString;
                mentions: z.ZodNumber;
            }, z.core.$strip>>;
            reachVsEngagement: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                data: z.ZodArray<z.ZodObject<{
                    x: z.ZodString;
                    y: z.ZodNumber;
                }, z.core.$strip>>;
            }, z.core.$strip>>;
            mentionMatrix: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                data: z.ZodArray<z.ZodObject<{
                    x: z.ZodString;
                    y: z.ZodNumber;
                }, z.core.$strip>>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        meta: z.ZodObject<{
            source: z.ZodEnum<{
                brand24: "brand24";
                org_mock: "org_mock";
            }>;
            organizationId: z.ZodString;
            brand24ProjectId: z.ZodNullable<z.ZodString>;
            fetchedAt: z.ZodString;
            snapshotDate: z.ZodOptional<z.ZodString>;
            periodStart: z.ZodOptional<z.ZodString>;
            periodEnd: z.ZodOptional<z.ZodString>;
            fromSnapshot: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    deltas: z.ZodObject<{
        totalMentions: z.ZodObject<{
            baseline: z.ZodNumber;
            current: z.ZodNumber;
            change: z.ZodNumber;
            percentChange: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strip>;
        positive: z.ZodObject<{
            baseline: z.ZodNumber;
            current: z.ZodNumber;
            change: z.ZodNumber;
            percentChange: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strip>;
        neutral: z.ZodObject<{
            baseline: z.ZodNumber;
            current: z.ZodNumber;
            change: z.ZodNumber;
            percentChange: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strip>;
        negative: z.ZodObject<{
            baseline: z.ZodNumber;
            current: z.ZodNumber;
            change: z.ZodNumber;
            percentChange: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type SocialListeningComparePayload = z.infer<typeof SocialListeningComparePayloadSchema>;
export declare const SocialListeningReportTemplateIdSchema: z.ZodEnum<{
    "executive-summary": "executive-summary";
    "full-dashboard": "full-dashboard";
    "period-compare": "period-compare";
}>;
export type SocialListeningReportTemplateId = z.infer<typeof SocialListeningReportTemplateIdSchema>;
export declare const SocialListeningReportTemplateMetaSchema: z.ZodObject<{
    id: z.ZodEnum<{
        "executive-summary": "executive-summary";
        "full-dashboard": "full-dashboard";
        "period-compare": "period-compare";
    }>;
    label: z.ZodString;
    description: z.ZodString;
    pageHint: z.ZodString;
    supportsCompare: z.ZodBoolean;
}, z.core.$strip>;
export type SocialListeningReportTemplateMeta = z.infer<typeof SocialListeningReportTemplateMetaSchema>;
