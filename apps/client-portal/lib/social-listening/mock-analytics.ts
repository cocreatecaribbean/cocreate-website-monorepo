import type { SocialListeningAnalytics } from '@/lib/social-listening/types'
import { SENTIMENT_COLORS } from '@/lib/social-listening/types'

export const mockSocialListeningAnalytics: SocialListeningAnalytics = {
  sentimentSummary: [
    {
      id: 'positive',
      label: 'Positive Mentions',
      value: 450,
      color: SENTIMENT_COLORS.positive,
    },
    {
      id: 'neutral',
      label: 'Neutral Mentions',
      value: 820,
      color: SENTIMENT_COLORS.neutral,
    },
    {
      id: 'negative',
      label: 'Negative Mentions',
      value: 110,
      color: SENTIMENT_COLORS.negative,
    },
  ],
  sentimentOverTime: [
    { date: '2026-05-18', positive: 32, neutral: 78, negative: 4 },
    { date: '2026-05-19', positive: 45, neutral: 110, negative: 5 },
    { date: '2026-05-20', positive: 60, neutral: 115, negative: 12 },
    { date: '2026-05-21', positive: 12, neutral: 90, negative: 85 },
    { date: '2026-05-22', positive: 95, neutral: 130, negative: 18 },
    { date: '2026-05-23', positive: 70, neutral: 105, negative: 8 },
    { date: '2026-05-24', positive: 85, neutral: 120, negative: 10 },
  ],
  sourceBreakdown: [
    { platformId: 'x', mentions: 1200 },
    { platformId: 'tiktok', mentions: 950 },
    { platformId: 'reddit', mentions: 430 },
    { platformId: 'instagram', mentions: 380 },
    { platformId: 'facebook', mentions: 520 },
    { platformId: 'web', mentions: 210 },
    { platformId: 'forums', mentions: 140 },
  ],
  reachVsEngagement: [
    {
      id: 'Social Reach (Thousands)',
      data: [
        { x: 'Mon', y: 150 },
        { x: 'Tue', y: 180 },
        { x: 'Wed', y: 420 },
        { x: 'Thu', y: 290 },
        { x: 'Fri', y: 310 },
        { x: 'Sat', y: 120 },
        { x: 'Sun', y: 95 },
      ],
    },
    {
      id: 'Engagement Volume',
      data: [
        { x: 'Mon', y: 12 },
        { x: 'Tue', y: 19 },
        { x: 'Wed', y: 140 },
        { x: 'Thu', y: 45 },
        { x: 'Fri', y: 58 },
        { x: 'Sat', y: 22 },
        { x: 'Sun', y: 15 },
      ],
    },
  ],
  mentionMatrix: [
    {
      id: 'Monday',
      data: [
        { x: '12am-6am', y: 12 },
        { x: '6am-12pm', y: 84 },
        { x: '12pm-6pm', y: 150 },
        { x: '6pm-12am', y: 95 },
      ],
    },
    {
      id: 'Tuesday',
      data: [
        { x: '12am-6am', y: 18 },
        { x: '6am-12pm', y: 92 },
        { x: '12pm-6pm', y: 210 },
        { x: '6pm-12am', y: 115 },
      ],
    },
    {
      id: 'Wednesday',
      data: [
        { x: '12am-6am', y: 35 },
        { x: '6am-12pm', y: 140 },
        { x: '12pm-6pm', y: 380 },
        { x: '6pm-12am', y: 240 },
      ],
    },
    {
      id: 'Thursday',
      data: [
        { x: '12am-6am', y: 22 },
        { x: '6am-12pm', y: 110 },
        { x: '12pm-6pm', y: 195 },
        { x: '6pm-12am', y: 130 },
      ],
    },
    {
      id: 'Friday',
      data: [
        { x: '12am-6am', y: 15 },
        { x: '6am-12pm', y: 95 },
        { x: '12pm-6pm', y: 260 },
        { x: '6pm-12am', y: 185 },
      ],
    },
  ],
}
