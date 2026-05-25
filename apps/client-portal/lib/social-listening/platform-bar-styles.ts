import type { SocialPlatformId } from '@/lib/social-listening/platform-meta'

/** Per-platform bar gradients — distinctive but anchored in CoCreate palette */
export type PlatformBarGradient = {
  start: string
  end: string
  /** Soft glow for SVG filter / tooltip accent */
  glow: string
}

export const PLATFORM_BAR_GRADIENTS: Record<SocialPlatformId, PlatformBarGradient> = {
  x: { start: '#39419a', end: '#6b72c4', glow: 'rgba(57, 65, 154, 0.45)' },
  tiktok: { start: '#f6b03f', end: '#ff5c8a', glow: 'rgba(246, 176, 63, 0.5)' },
  reddit: { start: '#ff5700', end: '#f6b03f', glow: 'rgba(255, 87, 0, 0.35)' },
  instagram: { start: '#f6b03f', end: '#c13584', glow: 'rgba(193, 53, 132, 0.35)' },
  facebook: { start: '#406eb5', end: '#1877f2', glow: 'rgba(24, 119, 242, 0.35)' },
  web: { start: '#7aa3dc', end: '#39419a', glow: 'rgba(64, 110, 181, 0.4)' },
  forums: { start: '#406eb5', end: '#f6b03f', glow: 'rgba(246, 176, 63, 0.4)' },
}

export function platformGradientDefId(platformId: SocialPlatformId): string {
  return `platform-grad-${platformId}`
}
