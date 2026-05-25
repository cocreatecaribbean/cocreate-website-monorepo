import type { CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createSupabaseServerClientWithCookies } from '@/lib/supabase/create-server-client'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClientWithCookies(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
  )
}

export async function getAccessToken() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}
