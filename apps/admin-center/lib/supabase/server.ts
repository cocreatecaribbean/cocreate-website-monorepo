import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabasePublicEnv } from '@/lib/supabase/env'

export async function createSupabaseServerClient() {
  const env = getSupabasePublicEnv()
  if (!env) {
    throw new Error('Supabase Auth env is not configured')
  }

  const cookieStore = await cookies()

  return createServerClient(env.url, env.anonKey, {
    cookies: {
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
    },
  })
}

/** Prefer getUser() so cookies refresh before reading the access token. */
export async function getAccessToken() {
  const env = getSupabasePublicEnv()
  if (!env) return null

  try {
    const supabase = await createSupabaseServerClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) return null

    const { data: sessionData } = await supabase.auth.getSession()
    return sessionData.session?.access_token ?? null
  } catch {
    return null
  }
}
