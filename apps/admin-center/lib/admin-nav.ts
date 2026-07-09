export type AdminNavId =
  | 'dashboard'
  | 'project-center'
  | 'clients'
  | 'messages'
  | 'social-listening'
  | 'team'
  | 'profile'
  | 'agency-profile'

/** Normalize App Router pathname for consistent nav matching. */
export function normalizeAdminPathname(pathname: string | null | undefined): string {
  if (pathname == null || pathname === '') return '/'
  const withoutQuery = pathname.split('?')[0] ?? '/'
  if (withoutQuery !== '/' && withoutQuery.endsWith('/')) {
    return withoutQuery.slice(0, -1)
  }
  return withoutQuery || '/'
}

/**
 * Resolve which sidebar item is active for the current route.
 * More specific prefixes are checked before general ones.
 */
export function getActiveAdminNavId(pathname: string | null | undefined): AdminNavId | null {
  const path = normalizeAdminPathname(pathname)

  if (path === '/') return 'dashboard'
  if (path.startsWith('/messages')) return 'messages'
  if (path.startsWith('/settings/agency-profile')) return 'agency-profile'
  if (path.startsWith('/profile')) return 'profile'
  if (path.startsWith('/team')) return 'team'
  if (path.startsWith('/social-listening')) return 'social-listening'
  if (/^\/clients\/[^/]+\/projects(\/|$)/.test(path)) return 'project-center'
  if (path.startsWith('/client-access') || path.startsWith('/clients')) return 'clients'
  if (path.startsWith('/project-center')) return 'project-center'

  return null
}
