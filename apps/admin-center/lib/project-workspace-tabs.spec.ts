import { parseProjectWorkspaceTab } from '@/lib/project-workspace-tabs'

describe('parseProjectWorkspaceTab (email deep links)', () => {
  it('honors progress and onboarding tab query values', () => {
    expect(parseProjectWorkspaceTab('progress')).toBe('progress')
    expect(parseProjectWorkspaceTab('onboarding')).toBe('onboarding')
  })
})
