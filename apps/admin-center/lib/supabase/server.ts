import type { CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabasePublicEnv } from '@/lib/supabase/env'
import { createSupabaseServerClientWithCookies } from '@/lib/supabase/create-server-client'

export async function createSupabaseServerClient() {
  const env = getSupabasePublicEnv()
  if (!env) {
    throw new Error('Supabase Auth env is not configured')
  }

  const cookieStore = await cookies()

  return createSupabaseServerClientWithCookies(env.url, env.anonKey, {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        )
      } catch {
        // Server Component — middleware handles refresh.
      }
    },
  })
}

/** Read bearer token from the session cookie (BFF routes validate via Nest). */
export async function getAccessToken() {
  const env = getSupabasePublicEnv()
  if (!env) return null

  try {
    const supabase = await createSupabaseServerClient()
    const { data: sessionData } = await supabase.auth.getSession()
    return sessionData.session?.access_token ?? null
  } catch {
    return null
  }
}
