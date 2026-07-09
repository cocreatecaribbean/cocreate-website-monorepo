import {
  PLATFORM_META,
  platformAxisLabel,
} from './platform-meta'

describe('platformAxisLabel', () => {
  it('uses short axis labels in abbrev mode for long platform names', () => {
    expect(platformAxisLabel('instagram', 'abbrev')).toBe('IG')
    expect(platformAxisLabel('facebook', 'abbrev')).toBe('FB')
    expect(platformAxisLabel('tiktok', 'abbrev')).toBe('TT')
    expect(platformAxisLabel('forums', 'abbrev')).toBe('Forum')
    expect(platformAxisLabel('web', 'abbrev')).toBe('Web')
  })

  it('uses full names in full mode', () => {
    expect(platformAxisLabel('instagram', 'full')).toBe('Instagram')
    expect(platformAxisLabel('web', 'full')).toBe('Web & blogs')
  })

  it('returns null in icon mode', () => {
    expect(platformAxisLabel('instagram', 'icon')).toBeNull()
  })
})

describe('PLATFORM_META axisLabel', () => {
  it('defines axis labels for all platforms', () => {
    for (const meta of Object.values(PLATFORM_META)) {
      expect(meta.axisLabel.length).toBeGreaterThan(0)
    }
  })
})
