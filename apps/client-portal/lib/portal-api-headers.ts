import { getAccessToken } from '@/lib/supabase/server'

export async function portalApiHeaders(
  json = false,
): Promise<Record<string, string> | null> {
  const token = await getAccessToken()
  if (!token) return null
  return json
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { Authorization: `Bearer ${token}` }
}
