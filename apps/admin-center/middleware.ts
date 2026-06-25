import { nestApiUrl } from '@cocreate/api-client'
import type { CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublicEnv, isSupabaseConfigured } from '@/lib/supabase/env'
import { createSupabaseServerClientWithCookies } from '@/lib/supabase/create-server-client'

const publicPaths = ['/login', '/auth/callback', '/auth/signout', '/collaborate/login']


const hubPaths = [
  '/',
  '/project-center',
  '/clients',
  '/client-access',
  '/team',
  '/profile',
  '/settings',
]

type SessionRole = 'SUPER_ADMIN' | 'ADMIN' | 'COLLABORATOR' | 'api_key' | null

type AdminAccessResult =
  | { status: 'ok'; role: SessionRole }
  | { status: 'unauthorized' }
  | { status: 'forbidden' }
  | { status: 'suspended' }
  | { status: 'unavailable' }

async function verifyAgencyAccess(accessToken: string): Promise<AdminAccessResult> {
  try {
    const response = await fetch(nestApiUrl('/auth/admin/me'), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    if (response.status === 401) return { status: 'unauthorized' }
    if (response.status === 403) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null
      const message = typeof body?.message === 'string' ? body.message : ''
      if (/suspended/i.test(message)) return { status: 'suspended' }
      return { status: 'forbidden' }
    }
    if (response.status === 404) return { status: 'unavailable' }
    if (!response.ok) return { status: 'unavailable' }
    const body = (await response.json()) as {
      mode?: string
      admin?: { role?: SessionRole }
    }
    if (body.mode === 'api_key') return { status: 'ok', role: 'api_key' }
    return { status: 'ok', role: body.admin?.role ?? null }
  } catch {
    return { status: 'unavailable' }
  }
}

function redirectWithCookies(baseResponse: NextResponse, url: URL): NextResponse {
  return NextResponse.redirect(url, { headers: baseResponse.headers })
}

function loginRedirect(
  request: NextRequest,
  baseResponse: NextResponse,
  error: string,
  nextPath?: string,
  loginPath = '/login',
): NextResponse {
  const loginUrl = new URL(loginPath, request.url)
  loginUrl.searchParams.set('error', error)
  if (nextPath && nextPath !== loginPath) {
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

function isHubPath(pathname: string): boolean {
  if (pathname === '/') return true
  return hubPaths.some(
    (path) => path !== '/' && (pathname === path || pathname.startsWith(`${path}/`)),
  )
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
      'Admin Center requires sign-in. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Doppler (run via `pnpm dev` / `doppler run`), seed an admin (`pnpm db:seed:admin your@email.com`), then open /login. For local bypass only, set ADMIN_DEV_SKIP_AUTH=true.',
      { status: 503 },
    )
  }

  const env = getSupabasePublicEnv()!
  let response = NextResponse.next({ request })

  const supabase = createSupabaseServerClientWithCookies(env.url, env.anonKey, {
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
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token ?? null

  if (pathname.startsWith('/api/')) {
    return response
  }

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    if (user && pathname.startsWith('/login') && accessToken) {
      const access = await verifyAgencyAccess(accessToken)
      if (access.status === 'ok') {
        const next = request.nextUrl.searchParams.get('next')
        if (access.role === 'COLLABORATOR') {
          const target = next?.startsWith('/collaborate')
            ? next
            : '/collaborate'
          return redirectWithCookies(response, new URL(target, request.url))
        }
        const target = next ?? '/'
        return redirectWithCookies(response, new URL(target, request.url))
      }
      if (access.status === 'unauthorized') {
        return signOutRedirect(request, response, 'session_expired')
      }
      if (access.status === 'suspended') {
        return signOutRedirect(request, response, 'admin_suspended')
      }
      if (access.status === 'forbidden') {
        return signOutRedirect(request, response, 'admin_required')
      }
    }
    return response
  }

  if (!user) {
    const loginPath = pathname.startsWith('/collaborate') ? '/collaborate/login' : '/login'
    return loginRedirect(request, response, 'auth', pathname, loginPath)
  }

  if (accessToken) {
    const access = await verifyAgencyAccess(accessToken)
    if (access.status === 'unauthorized') {
      return signOutRedirect(request, response, 'session_expired')
    }
    if (access.status === 'forbidden') {
      return signOutRedirect(request, response, 'admin_required')
    }
    if (access.status === 'suspended') {
      return signOutRedirect(request, response, 'admin_suspended')
    }

    if (access.status === 'ok' && access.role === 'COLLABORATOR') {
      if (isHubPath(pathname)) {
        return redirectWithCookies(response, new URL('/collaborate', request.url))
      }
      if (!pathname.startsWith('/collaborate')) {
        return redirectWithCookies(response, new URL('/collaborate', request.url))
      }
    }

    if (
      access.status === 'ok' &&
      (access.role === 'SUPER_ADMIN' || access.role === 'ADMIN' || access.role === 'api_key') &&
      pathname.startsWith('/collaborate')
    ) {
      return redirectWithCookies(response, new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
