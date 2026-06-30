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
}

export const PLATFORM_META: Record<SocialPlatformId, PlatformMeta> = {
  x: { id: 'x', name: 'X', shortName: 'X' },
  tiktok: { id: 'tiktok', name: 'TikTok', shortName: 'TikTok' },
  reddit: { id: 'reddit', name: 'Reddit', shortName: 'Reddit' },
  instagram: { id: 'instagram', name: 'Instagram', shortName: 'Instagram' },
  facebook: { id: 'facebook', name: 'Facebook', shortName: 'Facebook' },
  web: { id: 'web', name: 'Web & blogs', shortName: 'Web' },
  forums: { id: 'forums', name: 'Forums', shortName: 'Forums' },
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
