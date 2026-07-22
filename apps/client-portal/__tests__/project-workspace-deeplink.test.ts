import { parsePortalProjectTab } from '@/lib/control-center/project-workspace'

describe('parsePortalProjectTab (email deep links)', () => {
  it('honors progress and onboarding projectTab query values', () => {
    expect(parsePortalProjectTab('progress')).toBe('progress')
    expect(parsePortalProjectTab('onboarding')).toBe('onboarding')
  })

  it('maps legacy messages tab to progress', () => {
    expect(parsePortalProjectTab('messages')).toBe('progress')
  })
})
