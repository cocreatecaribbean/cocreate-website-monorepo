import type { SocialListeningAnalytics } from '@/lib/social-listening/types'

/** Ensure chart arrays exist after JSON snapshot round-trip */
export function normalizeSocialListeningAnalytics(
  data: Partial<SocialListeningAnalytics> | null | undefined,
): SocialListeningAnalytics | null {
  if (!data?.sentimentSummary?.length) return null

  return {
    sentimentSummary: data.sentimentSummary,
    sentimentOverTime: Array.isArray(data.sentimentOverTime)
      ? data.sentimentOverTime
      : [],
    sourceBreakdown: Array.isArray(data.sourceBreakdown)
      ? data.sourceBreakdown
      : [],
    reachVsEngagement: Array.isArray(data.reachVsEngagement)
      ? data.reachVsEngagement
      : [],
    mentionMatrix: Array.isArray(data.mentionMatrix) ? data.mentionMatrix : [],
  }
}
