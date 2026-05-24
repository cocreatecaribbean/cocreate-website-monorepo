import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublicEnv } from '@/lib/supabase/env'

export async function GET(request: NextRequest) {
  const env = getSupabasePublicEnv()
  const loginUrl = new URL('/login', request.url)

  if (!env) {
    return NextResponse.redirect(loginUrl)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        )
      },
    },
  })

  await supabase.auth.signOut()

  return NextResponse.redirect(loginUrl)
}

export async function POST(request: NextRequest) {
  return GET(request)
}
