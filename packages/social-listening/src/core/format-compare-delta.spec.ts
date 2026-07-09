import {
  formatMetricDeltaCompact,
  formatMetricDeltaLine,
  metricDelta,
} from './format-compare-delta'

describe('formatMetricDeltaCompact', () => {
  it('combines percent and absolute change with a single vs baseline suffix', () => {
    const delta = metricDelta(220, 1274)
    expect(formatMetricDeltaCompact(delta)).toBe('+479.1% (+1,054 vs baseline)')
    expect(formatMetricDeltaCompact(delta)).not.toContain('vs baseline ·')
  })

  it('falls back to absolute change when percent is unavailable', () => {
    const delta = metricDelta(0, 50)
    expect(formatMetricDeltaCompact(delta)).toBe('+50 vs baseline')
  })
})

describe('formatMetricDeltaLine', () => {
  it('keeps separate percent and absolute lines for KPI strip usage', () => {
    const delta = metricDelta(220, 1274)
    expect(formatMetricDeltaLine(delta, true)).toBe('+479.1% vs baseline')
    expect(formatMetricDeltaLine(delta)).toBe('+1,054 vs baseline')
  })
})
