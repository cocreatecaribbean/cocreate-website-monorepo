import { metricDelta } from './format-compare-delta'
import type { SocialListeningMetricDelta } from '@cocreate/api-contracts/v1/social-listening'
import { resolvePlatformId, type SocialPlatformId } from './platform-meta'
import type { SourceBreakdownRow } from './types'

export type PlatformMentionDelta = SocialListeningMetricDelta & {
  platformId: SocialPlatformId
}

export function computePlatformMentionDeltas(
  baseline: SourceBreakdownRow[],
  current: SourceBreakdownRow[],
): PlatformMentionDelta[] {
  const baselineMap = new Map(
    baseline.map((r) => [resolvePlatformId(r.platformId), r.mentions] as const),
  )
  const currentMap = new Map(
    current.map((r) => [resolvePlatformId(r.platformId), r.mentions] as const),
  )
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
