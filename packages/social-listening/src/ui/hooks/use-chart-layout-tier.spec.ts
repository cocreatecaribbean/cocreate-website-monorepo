import {
  computeBarChartLeftMargin,
  labelModeFromWidth,
  leftMarginForLabelMode,
  leftMarginForTier,
  tierFromWidth,
} from './use-chart-layout-tier'

describe('labelModeFromWidth', () => {
  it('buckets container width into label modes', () => {
    expect(labelModeFromWidth(280)).toBe('icon')
    expect(labelModeFromWidth(420)).toBe('abbrev')
    expect(labelModeFromWidth(600)).toBe('full')
  })
})

describe('leftMarginForLabelMode', () => {
  it('maps label modes to minimum left margins', () => {
    expect(leftMarginForLabelMode('icon')).toBe(40)
    expect(leftMarginForLabelMode('abbrev')).toBe(92)
    expect(leftMarginForLabelMode('full')).toBe(152)
  })
})

describe('computeBarChartLeftMargin', () => {
  it('sizes abbrev margin to fit the longest axis label', () => {
    expect(
      computeBarChartLeftMargin('abbrev', ['instagram', 'facebook', 'tiktok', 'forums']),
    ).toBeGreaterThanOrEqual(92)
  })

  it('uses icon gutter in icon mode', () => {
    expect(computeBarChartLeftMargin('icon', ['instagram'])).toBe(40)
  })
})

describe('deprecated tier aliases', () => {
  it('tierFromWidth mirrors labelModeFromWidth', () => {
    expect(tierFromWidth(280)).toBe('icon')
    expect(tierFromWidth(420)).toBe('abbrev')
    expect(tierFromWidth(600)).toBe('full')
  })

  it('leftMarginForTier mirrors leftMarginForLabelMode', () => {
    expect(leftMarginForTier('abbrev')).toBe(92)
  })
})
