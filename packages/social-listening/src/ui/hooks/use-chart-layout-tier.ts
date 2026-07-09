'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import {
  platformAxisLabel,
  type ChartAxisLabelMode,
  type SocialPlatformId,
} from '@cocreate/social-listening/core'

export type ChartLabelMode = ChartAxisLabelMode

const ICON_MAX = 300
const FULL_MIN = 520

export function labelModeFromWidth(width: number): ChartLabelMode {
  if (width < ICON_MAX) return 'icon'
  if (width < FULL_MIN) return 'abbrev'
  return 'full'
}

/** Minimum left margins — prefer computeBarChartLeftMargin when platform ids are known. */
export function leftMarginForLabelMode(mode: ChartLabelMode): number {
  switch (mode) {
    case 'icon':
      return 40
    case 'abbrev':
      return 92
    case 'full':
      return 152
  }
}

/** Size the Y-axis gutter from the longest label in the current dataset. */
export function computeBarChartLeftMargin(
  mode: ChartLabelMode,
  platformIds: SocialPlatformId[],
): number {
  if (mode === 'icon') return 40

  const maxChars = Math.max(
    0,
    ...platformIds.map((id) => (platformAxisLabel(id, mode) ?? '').length),
  )
  const iconAndGap = 28
  const charPx = mode === 'abbrev' ? 6.5 : 7.5
  const padding = 24
  const computed = Math.ceil(iconAndGap + maxChars * charPx + padding)

  if (mode === 'abbrev') {
    return Math.min(120, Math.max(92, computed))
  }
  return Math.min(172, Math.max(152, computed))
}

/** @deprecated Use labelModeFromWidth */
export function tierFromWidth(width: number): ChartLabelMode {
  return labelModeFromWidth(width)
}

/** @deprecated Use leftMarginForLabelMode */
export function leftMarginForTier(mode: ChartLabelMode): number {
  return leftMarginForLabelMode(mode)
}

/** Measures chart container width — responsive to column width, not viewport. */
export function useChartLayoutTier(): {
  ref: RefObject<HTMLDivElement | null>
  labelMode: ChartLabelMode
} {
  const ref = useRef<HTMLDivElement>(null)
  const [labelMode, setLabelMode] = useState<ChartLabelMode>('full')

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const sync = () => setLabelMode(labelModeFromWidth(el.clientWidth))
    sync()

    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, labelMode }
}
