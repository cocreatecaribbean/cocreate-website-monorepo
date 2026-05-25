import type { CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublicEnv } from '@/lib/supabase/env'
import { createSupabaseServerClientWithCookies } from '@/lib/supabase/create-server-client'

export async function GET(request: NextRequest) {
  const loginUrl = new URL('/login', request.url)
  const error = request.nextUrl.searchParams.get('error')
  if (error) {
    loginUrl.searchParams.set('error', error)
  }

  const env = getSupabasePublicEnv()
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
