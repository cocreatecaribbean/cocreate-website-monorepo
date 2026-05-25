import { getAccessToken } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export async function adminApiHeaders(
  json = false,
): Promise<Record<string, string> | null> {
  const token = await getAccessToken()
  if (token) {
    return json
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { Authorization: `Bearer ${token}` }
  }

  if (!isSupabaseConfigured() && process.env.ADMIN_API_KEY) {
    return json
      ? {
          'x-admin-key': process.env.ADMIN_API_KEY,
          'Content-Type': 'application/json',
        }
      : { 'x-admin-key': process.env.ADMIN_API_KEY }
  }

  return null
}
