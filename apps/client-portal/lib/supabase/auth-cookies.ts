import type { CookieOptions } from '@supabase/ssr'

/** Isolate Client Portal session from Admin Center on the same host (e.g. localhost). */
export function getSupabaseAuthCookieOptions(supabaseUrl: string): CookieOptions & {
  name: string
} {
  const ref = supabaseProjectRef(supabaseUrl)
  return {
    name: `sb-${ref}-client-auth-token`,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  }
}

function supabaseProjectRef(supabaseUrl: string): string {
  try {
    const host = new URL(supabaseUrl).hostname
    const ref = host.split('.')[0]
    return ref && ref.length > 0 ? ref : 'project'
  } catch {
    return 'project'
  }
}
