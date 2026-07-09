export const brandColors = {
  chambray: '#39419a',
  sanmarino: '#406eb5',
  casablanca: '#f6b03f',
  grid: '#e2e8f0',
  text: '#39419a',
  muted: '#64748b',
} as const

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

export function formatPercent(value: number, total: number): string {
  if (total <= 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}
