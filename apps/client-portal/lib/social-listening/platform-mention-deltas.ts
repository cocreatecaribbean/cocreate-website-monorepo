import { metricDelta } from '@/lib/social-listening/format-compare-delta'
import type { SocialListeningMetricDelta } from '@/lib/social-listening/api-types'
import type { SocialPlatformId } from '@/lib/social-listening/platform-meta'
import type { SourceBreakdownRow } from '@/lib/social-listening/types'

export type PlatformMentionDelta = SocialListeningMetricDelta & {
  platformId: SocialPlatformId
}

export function computePlatformMentionDeltas(
  baseline: SourceBreakdownRow[],
  current: SourceBreakdownRow[],
): PlatformMentionDelta[] {
  const baselineMap = new Map(baseline.map((r) => [r.platformId, r.mentions]))
  const currentMap = new Map(current.map((r) => [r.platformId, r.mentions]))
  const platformIds = new Set<SocialPlatformId>([
    ...baselineMap.keys(),
    ...currentMap.keys(),
  ])

  return [...platformIds]
    .map((platformId) => ({
      platformId,
      ...metricDelta(baselineMap.get(platformId) ?? 0, currentMap.get(platformId) ?? 0),
    }))
    .sort((a, b) => b.current - a.current)
}
