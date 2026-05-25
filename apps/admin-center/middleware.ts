import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublicEnv, isSupabaseConfigured } from '@/lib/supabase/env'

const publicPaths = ['/login', '/auth/callback', '/auth/signout']

const apiBase = () =>
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type AdminAccessResult =
  | 'ok'
  | 'forbidden'
  | 'unauthorized'
  | 'suspended'
  | 'unavailable'

async function verifyAdminAccess(accessToken: string): Promise<AdminAccessResult> {
  try {
    const response = await fetch(`${apiBase()}/auth/admin/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    if (response.status === 401) return 'unauthorized'
    if (response.status === 403) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null
      const message = typeof body?.message === 'string' ? body.message : ''
      if (/suspended/i.test(message)) return 'suspended'
      return 'forbidden'
    }
    if (response.status === 404) return 'unavailable'
    if (!response.ok) return 'unavailable'
    return 'ok'
  } catch {
    return 'unavailable'
  }
}

/** Keep Supabase session cookies when redirecting (required after getUser() refresh). */
function redirectWithCookies(baseResponse: NextResponse, url: URL): NextResponse {
  return NextResponse.redirect(url, { headers: baseResponse.headers })
}

function loginRedirect(
  request: NextRequest,
  baseResponse: NextResponse,
  error: string,
  nextPath?: string,
): NextResponse {
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('error', error)
  if (nextPath && nextPath !== '/login') {
    loginUrl.searchParams.set('next', nextPath)
  }
  return redirectWithCookies(baseResponse, loginUrl)
}

function signOutRedirect(
  request: NextRequest,
  baseResponse: NextResponse,
  error: string,
): NextResponse {
  const signOutUrl = new URL('/auth/signout', request.url)
  signOutUrl.searchParams.set('error', error)
  return redirectWithCookies(baseResponse, signOutUrl)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!isSupabaseConfigured()) {
    const devSkip =
      process.env.NODE_ENV === 'development' &&
      process.env.ADMIN_DEV_SKIP_AUTH === 'true'

    if (devSkip) {
      return NextResponse.next()
    }

    return new NextResponse(
      'Admin Center requires sign-in. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in apps/admin-center/.env.local, seed an admin (pnpm --filter @cocreate/database seed:admin your@email.com), then open /login. For local bypass only, set ADMIN_DEV_SKIP_AUTH=true.',
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

  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token ?? null

  // BFF routes return JSON errors — do not redirect HTML navigations to /login.
  if (pathname.startsWith('/api/')) {
    return response
  }

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    if (user && pathname.startsWith('/login') && accessToken) {
      const access = await verifyAdminAccess(accessToken)
      if (access === 'ok') {
        const next = request.nextUrl.searchParams.get('next') ?? '/'
        return redirectWithCookies(response, new URL(next, request.url))
      }
      if (access === 'unauthorized') {
        return signOutRedirect(request, response, 'session_expired')
      }
      if (access === 'suspended') {
        return signOutRedirect(request, response, 'admin_suspended')
      }
      if (access === 'forbidden') {
        return signOutRedirect(request, response, 'admin_required')
      }
    }
    return response
  }

  if (!user) {
    return loginRedirect(request, response, 'auth', pathname)
  }

  if (accessToken) {
    const access = await verifyAdminAccess(accessToken)
    if (access === 'unauthorized') {
      return signOutRedirect(request, response, 'session_expired')
    }
    if (access === 'forbidden') {
      return signOutRedirect(request, response, 'admin_required')
    }
    if (access === 'suspended') {
      return signOutRedirect(request, response, 'admin_suspended')
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
