import type { ReportCompareBundle, ReportRenderContext } from '../types'

const sampleAnalytics = {
  sentimentSummary: [
    { id: 'positive' as const, label: 'Positive', value: 1240, color: '#406eb5' },
    { id: 'neutral' as const, label: 'Neutral', value: 890, color: '#a8b8e8' },
    { id: 'negative' as const, label: 'Negative', value: 320, color: '#d94f4f' },
  ],
  sentimentOverTime: [
    { date: '2025-06-01', positive: 42, neutral: 28, negative: 12 },
    { date: '2025-06-02', positive: 38, neutral: 31, negative: 15 },
    { date: '2025-06-03', positive: 55, neutral: 22, negative: 9 },
    { date: '2025-06-04', positive: 48, neutral: 26, negative: 14 },
    { date: '2025-06-05', positive: 61, neutral: 19, negative: 11 },
    { date: '2025-06-06', positive: 52, neutral: 24, negative: 16 },
    { date: '2025-06-07', positive: 44, neutral: 30, negative: 13 },
    { date: '2025-06-08', positive: 58, neutral: 21, negative: 10 },
  ],
  sourceBreakdown: [
    { platformId: 'instagram', mentions: 820 },
    { platformId: 'facebook', mentions: 640 },
    { platformId: 'x', mentions: 410 },
    { platformId: 'tiktok', mentions: 380 },
    { platformId: 'reddit', mentions: 120 },
  ],
  reachVsEngagement: [
    {
      id: 'Reach (thousands)',
      data: [
        { x: 'Jun 1', y: 42 },
        { x: 'Jun 2', y: 48 },
        { x: 'Jun 3', y: 55 },
        { x: 'Jun 4', y: 51 },
        { x: 'Jun 5', y: 63 },
        { x: 'Jun 6', y: 58 },
        { x: 'Jun 7', y: 67 },
      ],
    },
    {
      id: 'Engagement',
      data: [
        { x: 'Jun 1', y: 1200 },
        { x: 'Jun 2', y: 1350 },
        { x: 'Jun 3', y: 1480 },
        { x: 'Jun 4', y: 1420 },
        { x: 'Jun 5', y: 1590 },
        { x: 'Jun 6', y: 1510 },
        { x: 'Jun 7', y: 1680 },
      ],
    },
  ],
  mentionMatrix: [],
}

const sampleMeta = {
  source: 'org_mock' as const,
  organizationId: 'org_sample',
  brand24ProjectId: null,
  fetchedAt: '2025-06-08T12:00:00.000Z',
  snapshotDate: '2025-06-08',
  periodStart: '2025-06-01T00:00:00.000Z',
  periodEnd: '2025-06-08T23:59:59.999Z',
}

export const sampleCompare: ReportCompareBundle = {
  baseline: {
    date: '2025-06-01',
    data: {
      ...sampleAnalytics,
      sentimentSummary: [
        { id: 'positive', label: 'Positive', value: 980, color: '#406eb5' },
        { id: 'neutral', label: 'Neutral', value: 720, color: '#a8b8e8' },
        { id: 'negative', label: 'Negative', value: 410, color: '#d94f4f' },
      ],
    },
    meta: sampleMeta,
  },
  current: {
    date: '2025-06-08',
    data: sampleAnalytics,
    meta: sampleMeta,
  },
  deltas: {
    totalMentions: { baseline: 2110, current: 2450, change: 340, percentChange: 12.4 },
    positive: { baseline: 980, current: 1240, change: 260, percentChange: 26.5 },
    neutral: { baseline: 720, current: 890, change: 170, percentChange: 23.6 },
    negative: { baseline: 410, current: 320, change: -90, percentChange: -21.9 },
  },
}

export function buildSampleReportContext(options?: {
  withCompare?: boolean
}): ReportRenderContext {
  const context: ReportRenderContext = {
    organization: {
      name: 'Caribbean Tourism Board',
      slug: 'caribbean-tourism',
      logoUrl: null,
    },
    snapshot: {
      data: sampleAnalytics,
      meta: sampleMeta,
    },
    generatedAt: new Date().toISOString(),
  }

  if (options?.withCompare) {
    context.compare = sampleCompare
  }

  return context
}
