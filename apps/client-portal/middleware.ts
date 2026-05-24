import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublicEnv, isSupabaseConfigured } from '@/lib/supabase/env'

const publicPaths = ['/login', '/auth/callback', '/auth/signout']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.next()
    }
    return new NextResponse(
      'Client Portal requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
      { status: 503 },
    )
  }

  const env = getSupabasePublicEnv()!
  let response = NextResponse.next({ request })

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    if (user && pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
