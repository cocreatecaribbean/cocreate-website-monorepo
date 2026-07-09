import type { SocialListeningAnalytics } from './types'
import { SENTIMENT_COLORS } from './types'
import { enumerateCalendarWeeksInPeriod } from './monthly-period-charts'

const WEEKS = enumerateCalendarWeeksInPeriod('2026-06-01', '2026-06-30')

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
  sentimentOverTime: WEEKS.map((week, index) => ({
    date: week.startDate,
    positive: [95, 110, 130, 85, 30][index] ?? 40,
    neutral: [180, 210, 240, 150, 40][index] ?? 50,
    negative: [18, 22, 25, 35, 10][index] ?? 8,
  })),
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
      data: WEEKS.map((week, index) => ({
        x: week.label,
        y: [150, 180, 420, 290, 210][index] ?? 200,
      })),
    },
    {
      id: 'Engagement Volume',
      data: WEEKS.map((week, index) => ({
        x: week.label,
        y: [12, 19, 140, 45, 28][index] ?? 20,
      })),
    },
  ],
  mentionMatrix: WEEKS.map((week, weekIndex) => ({
    id: week.label,
    data: [
      { x: '12am-6am', y: 12 + weekIndex * 2 },
      { x: '6am-12pm', y: 84 + weekIndex * 4 },
      { x: '12pm-6pm', y: 150 + weekIndex * 6 },
      { x: '6pm-12am', y: 95 + weekIndex * 3 },
    ],
  })),
}
