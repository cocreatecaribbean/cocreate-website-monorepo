export type SocialPlatformId =
  | 'x'
  | 'tiktok'
  | 'reddit'
  | 'instagram'
  | 'facebook'
  | 'web'
  | 'forums'

export type PlatformMeta = {
  id: SocialPlatformId
  name: string
  shortName: string
  /** Short label for bar chart Y-axis when space is limited */
  axisLabel: string
}

export type ChartAxisLabelMode = 'full' | 'abbrev' | 'icon'

export const PLATFORM_META: Record<SocialPlatformId, PlatformMeta> = {
  x: { id: 'x', name: 'X', shortName: 'X', axisLabel: 'X' },
  tiktok: { id: 'tiktok', name: 'TikTok', shortName: 'TikTok', axisLabel: 'TT' },
  reddit: { id: 'reddit', name: 'Reddit', shortName: 'Reddit', axisLabel: 'Reddit' },
  instagram: { id: 'instagram', name: 'Instagram', shortName: 'Instagram', axisLabel: 'IG' },
  facebook: { id: 'facebook', name: 'Facebook', shortName: 'Facebook', axisLabel: 'FB' },
  web: { id: 'web', name: 'Web & blogs', shortName: 'Web', axisLabel: 'Web' },
  forums: { id: 'forums', name: 'Forums', shortName: 'Forums', axisLabel: 'Forum' },
}

/** Y-axis text for bar charts — null when icon-only mode. */
export function platformAxisLabel(
  id: SocialPlatformId,
  mode: ChartAxisLabelMode,
): string | null {
  const meta = PLATFORM_META[id]
  if (mode === 'icon') return null
  if (mode === 'abbrev') return meta.axisLabel
  return meta.name
}

/** Map legacy or API platform strings to a stable id */
export function resolvePlatformId(platform: string): SocialPlatformId {
  const normalized = platform.trim().toLowerCase()
  if (normalized.includes('twitter') || normalized === 'x') return 'x'
  if (normalized.includes('tiktok')) return 'tiktok'
  if (normalized.includes('reddit')) return 'reddit'
  if (normalized.includes('instagram')) return 'instagram'
  if (normalized.includes('facebook') || normalized.includes('meta')) return 'facebook'
  if (normalized.includes('forum')) return 'forums'
  if (normalized.includes('web') || normalized.includes('blog')) return 'web'
  return 'web'
}

export function getPlatformMeta(platformOrId: string): PlatformMeta {
  const id = platformOrId in PLATFORM_META
    ? (platformOrId as SocialPlatformId)
    : resolvePlatformId(platformOrId)
  return PLATFORM_META[id]
}
