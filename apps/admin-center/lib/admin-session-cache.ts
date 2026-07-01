const ADMIN_SESSION_CACHE_KEY = 'admin-session-cache'
const ADMIN_SESSION_CACHE_MS = 30_000

type CachedAdminSession = {
  at: number
  session: {
    mode: 'user' | 'api_key'
    userId: string | null
    email: string | null
    status: string | null
    role: import('@/lib/admin-session').AdminPortalRole | null
    displayName?: string | null
    profileComplete?: boolean
  }
}

export function readAdminSessionCache(): CachedAdminSession['session'] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedAdminSession
    if (Date.now() - parsed.at > ADMIN_SESSION_CACHE_MS) return null
    return parsed.session
  } catch {
    return null
  }
}

export function writeAdminSessionCache(session: CachedAdminSession['session']) {
  if (typeof window === 'undefined') return
  const payload: CachedAdminSession = { at: Date.now(), session }
  sessionStorage.setItem(ADMIN_SESSION_CACHE_KEY, JSON.stringify(payload))
}

export function clearAdminSessionCache() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(ADMIN_SESSION_CACHE_KEY)
}
