import type { Theme } from '@nivo/core'
import { SENTIMENT_BRAND_COLORS } from '@/lib/social-listening/sentiment-meta'

export const brandColors = {
  chambray: '#39419a',
  sanmarino: '#406eb5',
  casablanca: '#f6b03f',
  grid: '#e2e8f0',
  text: '#39419a',
  muted: '#64748b',
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

export const nivoTheme: Theme = {
  background: 'transparent',
  text: {
    fontSize: 12,
    fill: brandColors.text,
  },
  axis: {
    domain: {
      line: { stroke: brandColors.grid, strokeWidth: 1 },
    },
    ticks: {
      line: { stroke: brandColors.grid, strokeWidth: 1 },
      text: { fill: brandColors.muted, fontSize: 11 },
    },
    legend: {
      text: { fill: brandColors.text, fontSize: 12, fontWeight: 600 },
    },
  },
  grid: {
    line: { stroke: 'rgba(64, 110, 181, 0.12)', strokeWidth: 1 },
  },
  legends: {
    text: { fill: brandColors.text, fontSize: 11 },
  },
  tooltip: {
    container: {
      background: 'transparent',
      color: brandColors.text,
      fontSize: 12,
      boxShadow: 'none',
      padding: 0,
    },
  },
  labels: {
    text: { fill: '#ffffff', fontSize: 11, fontWeight: 600 },
  },
}

export function formatPercent(value: number, total: number): string {
  if (total <= 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}
