import type { CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublicEnv } from '@/lib/supabase/env'
import { createSupabaseServerClientWithCookies } from '@/lib/supabase/create-server-client'

/**
 * Clears the portal session and redirects to /login.
 * Do not point Next.js <Link> at this route — Link prefetch issues a GET and would
 * sign users out. Navigate here only from an explicit button click (router.push /
 * location.assign), matching Admin Center.
 */
export async function GET(request: NextRequest) {
  const env = getSupabasePublicEnv()
  const loginUrl = new URL('/login', request.url)
  const error = request.nextUrl.searchParams.get('error')
  if (error) {
    loginUrl.searchParams.set('error', error)
  }

  if (!env) {
    return NextResponse.redirect(loginUrl)
  }

  const cookieStore = await cookies()
  const supabase = createSupabaseServerClientWithCookies(env.url, env.anonKey, {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
      cookiesToSet.forEach(({ name, value, options }) =>
        cookieStore.set(name, value, options),
      )
    },
  })

  await supabase.auth.signOut()

  return NextResponse.redirect(loginUrl)
}

export async function POST(request: NextRequest) {
  return GET(request)
}
