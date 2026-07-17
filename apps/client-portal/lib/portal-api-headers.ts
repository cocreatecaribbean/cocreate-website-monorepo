import { cookies } from 'next/headers'
import { getAccessToken } from '@/lib/supabase/server'
import { ACTIVE_ORG_COOKIE } from '@/lib/api/active-organization'

export async function portalApiHeaders(
  json = false,
  request?: Request,
): Promise<Record<string, string> | null> {
  const token = await getAccessToken()
  if (!token) return null

  const fromRequest = request?.headers.get('x-organization-id')
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(ACTIVE_ORG_COOKIE)?.value
  const organizationId = fromRequest?.trim() || fromCookie || null

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  }
  if (json) headers['Content-Type'] = 'application/json'
  if (organizationId) headers['X-Organization-Id'] = organizationId
  return headers
}
