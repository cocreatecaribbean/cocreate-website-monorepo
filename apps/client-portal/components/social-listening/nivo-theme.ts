import type { Theme } from '@nivo/core'
import { SENTIMENT_BRAND_COLORS } from '@client-portal/lib/social-listening/sentiment-meta'

export const brandColors = {
  chambray: '#39419a',
  sanmarino: '#406eb5',
  casablanca: '#f6b03f',
  grid: '#e2e8f0',
  text: '#39419a',
  muted: '#64748b',
} as const

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

export const lineSeriesColors = [brandColors.chambray, brandColors.casablanca]

/** Brand sequential scale for heatmap */
export const heatmapBrandScale = [
  '#eef2fa',
  '#c5cee8',
  '#7aa3dc',
  '#406eb5',
  '#39419a',
  '#f6b03f',
]

export function getNivoTheme(isDark: boolean): Theme {
  const colors = isDark ? darkBrandColors : brandColors
  return {
    background: 'transparent',
    text: {
      fontSize: 12,
      fill: colors.text,
    },
    axis: {
      domain: {
        line: { stroke: colors.grid, strokeWidth: 1 },
      },
      ticks: {
        line: { stroke: colors.grid, strokeWidth: 1 },
        text: { fill: colors.muted, fontSize: 11 },
      },
      legend: {
        text: { fill: colors.text, fontSize: 12, fontWeight: 600 },
      },
    },
    grid: {
      line: {
        stroke: isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(64, 110, 181, 0.12)',
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
      },
    },
    labels: {
      text: { fill: '#ffffff', fontSize: 11, fontWeight: 600 },
    },
  }
}

/** @deprecated Use useNivoTheme() in client components */
export const nivoTheme: Theme = getNivoTheme(false)

export function formatPercent(value: number, total: number): string {
  if (total <= 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}
