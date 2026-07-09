import type { ChartConfig } from './chart'

export const portalBrandColors = {
  chambray: '#39419a',
  sanmarino: '#406eb5',
  casablanca: '#f6b03f',
  grid: '#e2e8f0',
  text: '#39419a',
  muted: '#64748b',
} as const

const darkPortalBrandColors = {
  ...portalBrandColors,
  grid: '#334155',
  text: '#f8fafc',
  muted: '#f6b03f',
} as const

export function getPortalChartCssVars(isDark: boolean): Record<string, string> {
  const colors = isDark ? darkPortalBrandColors : portalBrandColors
  return {
    '--chart-1': colors.chambray,
    '--chart-2': colors.casablanca,
    '--chart-3': colors.sanmarino,
    '--chart-4': colors.muted,
    '--chart-5': colors.grid,
    '--chart-axis': colors.muted,
    '--chart-grid': isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(64, 110, 181, 0.2)',
    '--chart-text': colors.text,
  }
}

export function getReachEngagementChartConfig(isDark: boolean): ChartConfig {
  const colors = isDark ? darkPortalBrandColors : portalBrandColors
  return {
    reach: {
      label: 'Social Reach (Thousands)',
      color: colors.chambray,
    },
    engagement: {
      label: 'Engagement Volume',
      color: colors.casablanca,
    },
  }
}

export function getSentimentPieChartConfig(): ChartConfig {
  return {
    positive: { label: 'Positive', color: '#406eb5' },
    neutral: { label: 'Neutral', color: '#a8b8e8' },
    negative: { label: 'Negative', color: '#d94f4f' },
  }
}
