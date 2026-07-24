import type { CSSProperties } from 'react'
import type { BrandTextFill } from '@cocreate/types'

export const DEFAULT_BRAND_HEADLINE_CLASS =
  'bg-linear-to-r from-sanmarino via-chambray to-casablanca bg-clip-text text-transparent'

export function headlineFillStyle(
  fill: BrandTextFill | undefined,
  defaultClassName: string = DEFAULT_BRAND_HEADLINE_CLASS,
): {
  className: string
  style?: CSSProperties
} {
  if (!fill) {
    return {className: defaultClassName}
  }

  if (fill.mode === 'solid') {
    return {
      className: '',
      style: {color: fill.color},
    }
  }

  const stops = fill.via
    ? `${fill.from}, ${fill.via}, ${fill.to}`
    : `${fill.from}, ${fill.to}`

  return {
    className: 'bg-clip-text text-transparent',
    style: {
      backgroundImage: `linear-gradient(${fill.angle}deg, ${stops})`,
    },
  }
}
