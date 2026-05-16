export type CarouselLayout = {
  tileWidth: number
  spacing: number
  centerZ: number
  perspective: number
  maxVisibleOffset: number
  rotateStep: number
}

export const CAROUSEL_LAYOUTS = {
  sm: {
    tileWidth: 128,
    spacing: 68,
    centerZ: 72,
    perspective: 900,
    maxVisibleOffset: 1,
    rotateStep: 26,
  },
  md: {
    tileWidth: 300,
    spacing: 208,
    centerZ: 140,
    perspective: 1200,
    maxVisibleOffset: 2,
    rotateStep: 36,
  },
  lg: {
    tileWidth: 360,
    spacing: 248,
    centerZ: 165,
    perspective: 1350,
    maxVisibleOffset: 2,
    rotateStep: 36,
  },
} satisfies Record<'sm' | 'md' | 'lg', CarouselLayout>

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** Size the 3D carousel from the stage width so mobile stays in bounds. */
export function computeCarouselLayout(containerWidth: number): CarouselLayout {
  if (containerWidth >= 1024) {
    return { ...CAROUSEL_LAYOUTS.lg }
  }
  if (containerWidth >= 768) {
    return { ...CAROUSEL_LAYOUTS.md }
  }

  const tileWidth = Math.round(clamp(containerWidth * 0.44, 108, 188))
  const spacing = Math.round(clamp(containerWidth * 0.22, 54, 82))
  const centerZ = Math.round(clamp(containerWidth * 0.18, 56, 88))
  const perspective = Math.round(clamp(containerWidth * 2.8, 820, 980))
  const maxVisibleOffset = containerWidth < 400 ? 1 : 2
  const rotateStep = containerWidth < 380 ? 22 : 26

  return {
    tileWidth,
    spacing,
    centerZ,
    perspective,
    maxVisibleOffset,
    rotateStep,
  }
}

export type CylinderTileStyle = {
  transform: string
  opacity: number
  zIndex: number
  filter: string
}

/** `activePosition` may be fractional while dragging */
export function getWrappedOffset(
  index: number,
  activePosition: number,
  length: number,
): number {
  let offset = index - activePosition
  const half = length / 2
  if (offset > half) offset -= length
  if (offset < -half) offset += length
  return offset
}

export function getCylinderTileStyle(
  offset: number,
  layout: CarouselLayout,
): CylinderTileStyle {
  const abs = Math.abs(offset)
  const hideBeyond = layout.maxVisibleOffset + 0.35

  if (abs > hideBeyond) {
    return {
      transform:
        'translate3d(-50%, -50%, -220px) rotateY(0deg) scale(0.5)',
      opacity: 0,
      zIndex: 0,
      filter: 'brightness(0.6)',
    }
  }

  const { spacing, centerZ, rotateStep } = layout
  const rotateY = offset * rotateStep
  const scale = abs < 0.05 ? 1 : Math.max(0.7, 1 - abs * 0.14)
  const translateZ = abs < 0.05 ? centerZ : centerZ - 55 - abs * 38
  const translateX = offset * spacing
  const opacity = abs < 0.05 ? 1 : Math.max(0.42, 1 - abs * 0.2)
  const brightness = abs < 0.05 ? 1 : Math.max(0.68, 1 - abs * 0.12)
  const zIndex = Math.round(30 - abs * 10)

  return {
    transform: `translate3d(calc(-50% + ${translateX}px), -50%, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
    opacity,
    zIndex,
    filter: `brightness(${brightness})`,
  }
}
