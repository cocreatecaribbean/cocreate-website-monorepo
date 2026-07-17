const STORAGE_KEY = 'cocreate.portal.activeOrganizationId'
export const ACTIVE_ORG_COOKIE = 'cocreate_active_organization_id'

export function getActiveOrganizationId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function setActiveOrganizationId(organizationId: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (!organizationId) {
      window.localStorage.removeItem(STORAGE_KEY)
      document.cookie = `${ACTIVE_ORG_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
    } else {
      window.localStorage.setItem(STORAGE_KEY, organizationId)
      document.cookie = `${ACTIVE_ORG_COOKIE}=${encodeURIComponent(organizationId)}; Path=/; Max-Age=31536000; SameSite=Lax`
    }
  } catch {
    // ignore quota / private mode
  }
}

/** Auth headers for client-portal Nest API calls (Bearer + active org). */
export function portalAuthHeaders(
  token: string,
  extra?: HeadersInit,
): Record<string, string> {
  const orgId = getActiveOrganizationId()
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  }
  if (orgId) {
    headers['X-Organization-Id'] = orgId
  }
  if (extra) {
    const plain = new Headers(extra)
    plain.forEach((value, key) => {
      headers[key] = value
    })
  }
  return headers
}
