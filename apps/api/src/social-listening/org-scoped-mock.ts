import type {
  SocialListeningAnalytics,
  SocialPlatformId,
  SentimentId,
} from './social-listening.types'
import { SENTIMENT_COLORS } from './social-listening.types'
import { formatUtcDateOnly } from './social-listening-dates'

function hashSeed(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0
  }
  return h
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function isoDateDaysBefore(anchor: Date, daysBefore: number): string {
  const d = new Date(anchor)
  d.setUTCDate(d.getUTCDate() - daysBefore)
  return d.toISOString().slice(0, 10)
}

const PLATFORMS: SocialPlatformId[] = [
  'x',
  'tiktok',
  'reddit',
  'instagram',
  'facebook',
  'web',
  'forums',
]

const TIME_BLOCKS = ['12am-6am', '6am-12pm', '12pm-6pm', '6pm-12am']
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const CHART_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export type OrgScopedMockOptions = {
  /** End of the analytics window (defaults to now) */
  periodEnd?: Date
}

/** Per-tenant mock until Brand24 subscription + API key are live. */
export function buildOrgScopedMockAnalytics(
  organizationId: string,
  projectId?: string | null,
  options?: OrgScopedMockOptions,
): SocialListeningAnalytics {
  const periodEnd = options?.periodEnd ?? new Date()
  const seed = hashSeed(
    `${organizationId}:${projectId ?? ''}:${formatUtcDateOnly(periodEnd)}`,
  )
  const rand = mulberry32(seed)

  const scale = 0.55 + rand() * 0.9
  const positive = Math.round(280 + rand() * 400 * scale)
  const neutral = Math.round(500 + rand() * 600 * scale)
  const negative = Math.round(40 + rand() * 120 * scale)

  const sentimentSummary: { id: SentimentId; label: string; value: number }[] = [
    { id: 'positive', label: 'Positive Mentions', value: positive },
    { id: 'neutral', label: 'Neutral Mentions', value: neutral },
    { id: 'negative', label: 'Negative Mentions', value: negative },
  ]

  const sentimentOverTime = Array.from({ length: 7 }, (_, i) => ({
    date: isoDateDaysBefore(periodEnd, 6 - i),
    positive: Math.round(positive / 14 + rand() * 40),
    neutral: Math.round(neutral / 14 + rand() * 60),
    negative: Math.round(negative / 14 + rand() * 15),
  }))

  const sourceBreakdown = PLATFORMS.map((platformId) => ({
    platformId,
    mentions: Math.round((200 + rand() * 900) * scale),
  })).sort((a, b) => b.mentions - a.mentions)

  const reachVsEngagement = [
    {
      id: 'Social Reach (Thousands)',
      data: CHART_DAYS.map((x) => ({
        x,
        y: Math.round(80 + rand() * 380),
      })),
    },
    {
      id: 'Engagement Volume',
      data: CHART_DAYS.map((x) => ({
        x,
        y: Math.round(8 + rand() * 120),
      })),
    },
  ]

  const mentionMatrix = WEEKDAYS.map((id) => ({
    id,
    data: TIME_BLOCKS.map((x) => ({
      x,
      y: Math.round(10 + rand() * 350 * scale),
    })),
  }))

  return {
    sentimentSummary: sentimentSummary.map((s) => ({
      ...s,
      color: SENTIMENT_COLORS[s.id],
    })),
    sentimentOverTime,
    sourceBreakdown,
    reachVsEngagement,
    mentionMatrix,
  }
}
