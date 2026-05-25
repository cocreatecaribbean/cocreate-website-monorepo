import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { getSupabaseAuthCookieOptions } from '@/lib/supabase/auth-cookies'

type CookieStore = {
  getAll(): { name: string; value: string }[]
  setAll(cookies: { name: string; value: string; options: CookieOptions }[]): void
}

export function createSupabaseServerClientWithCookies(
  supabaseUrl: string,
  supabaseAnonKey: string,
  cookieStore: CookieStore,
) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: getSupabaseAuthCookieOptions(supabaseUrl),
    cookies: cookieStore,
  })
}
