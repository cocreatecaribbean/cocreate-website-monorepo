import type { ReportFormat } from './page-sizes'

export const CHART_WIDTHS = {
  letter: 480,
  deck: 1600,
} as const

export function chartWidth(format: ReportFormat): number {
  return CHART_WIDTHS[format]
}

export const CHART_SIZES = {
  letter: {
    donut: { size: 220, innerRatio: 0.58 },
    barHeight: 22,
    barGap: 10,
    reachHeight: 200,
    trendHeight: 200,
    pageBleed: 48,
  },
  deck: {
    donut: { size: 420, innerRatio: 0.58 },
    barHeight: 36,
    barGap: 16,
    reachHeight: 480,
    trendHeight: 480,
    pageBleed: 96,
  },
} as const

export function getChartSizes(format: ReportFormat) {
  return CHART_SIZES[format]
}
