import { getWrappedOffset } from '@/utils/carousel-cylinder-math'

export type ArcGalleryLayout = {
  tileWidth: number
  spacing: number
  /** How far side tiles drop along the arc (px) */
  arcLift: number
  maxRotate: number
  /** Furthest slot index from center still shown (1 = neighbors only) */
  maxVisibleOffset: number
}

export const ARC_GALLERY_LAYOUTS = {
  sm: {
    tileWidth: 132,
    spacing: 72,
    arcLift: 14,
    maxRotate: 10,
    maxVisibleOffset: 1,
  },
  /** iPad Mini / tablet content width (~640–767px) — between mobile fluid and md */
  tablet: {
    tileWidth: 212,
    spacing: 172,
    arcLift: 32,
    maxRotate: 14,
    maxVisibleOffset: 2,
  },
  md: {
    tileWidth: 188,
    spacing: 152,
    arcLift: 30,
    maxRotate: 14,
    maxVisibleOffset: 2,
  },
  lg: {
    tileWidth: 248,
    spacing: 198,
    arcLift: 40,
    maxRotate: 16,
    maxVisibleOffset: 2,
  },
  xl: {
    tileWidth: 300,
    spacing: 238,
    arcLift: 48,
    maxRotate: 17,
    maxVisibleOffset: 2,
  },
} satisfies Record<'sm' | 'tablet' | 'md' | 'lg' | 'xl', ArcGalleryLayout>

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** Derive arc dimensions from the actual stage width (critical on mobile). */
export function computeArcLayout(containerWidth: number): ArcGalleryLayout {
  if (containerWidth >= 1200) {
    return { ...ARC_GALLERY_LAYOUTS.xl }
  }
  if (containerWidth >= 1024) {
    return { ...ARC_GALLERY_LAYOUTS.lg }
  }
  if (containerWidth >= 768) {
    return { ...ARC_GALLERY_LAYOUTS.md }
  }
  if (containerWidth >= 640) {
    return { ...ARC_GALLERY_LAYOUTS.tablet }
  }

  const tileWidth = Math.round(clamp(containerWidth * 0.46, 112, 172))
  const spacing = Math.round(clamp(containerWidth * 0.23, 56, 84))
  const arcLift = Math.round(clamp(containerWidth * 0.04, 10, 18))
  const maxRotate = containerWidth < 360 ? 8 : 10
  const maxVisibleOffset = containerWidth < 420 ? 1 : 2

  return {
    tileWidth,
    spacing,
    arcLift,
    maxRotate,
    maxVisibleOffset,
  }
}

export type ArcTileStyle = {
  transform: string
  opacity: number
  zIndex: number
  filter: string
}

export { getWrappedOffset }

export function getArcTileStyle(
  offset: number,
  layout: ArcGalleryLayout,
): ArcTileStyle {
  const abs = Math.abs(offset)
  const hideBeyond = layout.maxVisibleOffset + 0.35

  if (abs > hideBeyond) {
    return {
      transform: 'translate(-50%, -50%) scale(0.45)',
      opacity: 0,
      zIndex: 0,
      filter: 'brightness(0.55)',
    }
  }

  const x = offset * layout.spacing
  const y = layout.arcLift * offset * offset
  const rotate = -offset * layout.maxRotate
  const scale = Math.max(0.62, 1 - abs * 0.12)
  const opacity = Math.max(0.45, 1 - abs * 0.16)
  const brightness = Math.max(0.75, 1 - abs * 0.1)
  const zIndex = Math.round(50 - abs * 9)

  return {
    transform: `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0) rotate(${rotate}deg) scale(${scale})`,
    opacity,
    zIndex,
    filter: `brightness(${brightness})`,
  }
}
