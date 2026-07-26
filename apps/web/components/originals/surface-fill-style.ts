import type { CSSProperties } from 'react'
import type { BrandTextFill } from '@cocreate/types'

/** Apply BrandTextFill to a surface (background), not clipped text. */
export function surfaceFillStyle(
  fill: BrandTextFill | undefined,
  fallbackColor: string,
): CSSProperties {
  if (!fill) {
    return { backgroundColor: fallbackColor }
  }

  if (fill.mode === 'solid') {
    return { backgroundColor: fill.color }
  }

  const stops = fill.via
    ? `${fill.from}, ${fill.via}, ${fill.to}`
    : `${fill.from}, ${fill.to}`

  return {
    backgroundImage: `linear-gradient(${fill.angle}deg, ${stops})`,
  }
}
