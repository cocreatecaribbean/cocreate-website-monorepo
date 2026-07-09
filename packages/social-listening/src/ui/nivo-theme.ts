import type { Theme } from '@nivo/core'
import { SENTIMENT_BRAND_COLORS } from '@cocreate/social-listening/core'
import { brandColors, heatmapBrandScale } from './chart-shared'

export { brandColors, heatmapBrandScale, formatPercent, lineSeriesColors } from './chart-shared'

const darkBrandColors = {
  ...brandColors,
  grid: '#334155',
  text: '#f8fafc',
  muted: '#f6b03f',
} as const

export const sentimentStreamKeys = ['positive', 'neutral', 'negative'] as const

export const sentimentStreamColors = [
  SENTIMENT_BRAND_COLORS.positive,
  SENTIMENT_BRAND_COLORS.neutral,
  SENTIMENT_BRAND_COLORS.negative,
]

export function getNivoTheme(isDark: boolean): Theme {
  const colors = isDark ? darkBrandColors : brandColors
  return {
    background: 'transparent',
    text: {
      fontSize: 12,
      fill: colors.text,
      fontWeight: 500,
    },
    axis: {
      domain: {
        line: { stroke: colors.grid, strokeWidth: 1 },
      },
      ticks: {
        line: { stroke: colors.grid, strokeWidth: 1 },
        text: { fill: colors.muted, fontSize: 11, fontWeight: 500 },
      },
      legend: {
        text: { fill: colors.text, fontSize: 12, fontWeight: 600 },
      },
    },
    grid: {
      line: {
        stroke: isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(64, 110, 181, 0.2)',
        strokeWidth: 1,
      },
    },
    legends: {
      text: { fill: colors.text, fontSize: 11 },
    },
    tooltip: {
      container: {
        background: 'transparent',
        color: colors.text,
        fontSize: 12,
        boxShadow: 'none',
        padding: 0,
        pointerEvents: 'none',
      },
    },
    labels: {
      text: { fill: '#ffffff', fontSize: 11, fontWeight: 600 },
    },
  }
}

/** @deprecated Use useNivoTheme() in client components */
export const nivoTheme: Theme = getNivoTheme(false)
