import { getActiveAdminNavId, normalizeAdminPathname } from './admin-nav'

describe('normalizeAdminPathname', () => {
  it('strips query strings and trailing slashes', () => {
    expect(normalizeAdminPathname('/clients/org-1/?tab=files')).toBe('/clients/org-1')
    expect(normalizeAdminPathname('/project-center/')).toBe('/project-center')
  })
})

describe('getActiveAdminNavId', () => {
  it('highlights project center for project workspace routes', () => {
    expect(getActiveAdminNavId('/project-center')).toBe('project-center')
    expect(getActiveAdminNavId('/clients/org-1/projects/proj-1')).toBe('project-center')
    expect(getActiveAdminNavId('/clients/org-1/projects/proj-1?tab=files')).toBe('project-center')
  })

  it('highlights clients for client workspace routes', () => {
    expect(getActiveAdminNavId('/clients')).toBe('clients')
    expect(getActiveAdminNavId('/clients/org-1')).toBe('clients')
    expect(getActiveAdminNavId('/client-access')).toBe('clients')
  })

  it('highlights other top-level sections', () => {
    expect(getActiveAdminNavId('/')).toBe('dashboard')
    expect(getActiveAdminNavId('/messages')).toBe('messages')
  })
})
