import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseAuthCookieOptions } from '@/lib/supabase/auth-cookies'

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return createBrowserClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: getSupabaseAuthCookieOptions(url),
  })
}
