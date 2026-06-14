import type { CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublicEnv, isSupabaseConfigured } from '@/lib/supabase/env'
import { createSupabaseServerClientWithCookies } from '@/lib/supabase/create-server-client'

const publicPaths = ['/login', '/auth/callback', '/auth/signout']

const apiBase = () =>
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type ClientAccessResult =
  | 'ok'
  | 'forbidden'
  | 'unauthorized'
  | 'unavailable'

async function verifyClientAccess(accessToken: string): Promise<ClientAccessResult> {
  try {
    const response = await fetch(`${apiBase()}/client-portal/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    if (response.status === 401) return 'unauthorized'
    if (response.status === 403) return 'forbidden'
    if (!response.ok) return 'unavailable'
    return 'ok'
  } catch {
    return 'unavailable'
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
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.next()
    }
    return new NextResponse(
      'Client Portal requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Doppler (run via `pnpm dev` / `doppler run`)',
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

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    if (user && pathname.startsWith('/login') && accessToken) {
      const access = await verifyClientAccess(accessToken)
      if (access === 'ok') {
        const next = request.nextUrl.searchParams.get('next') ?? '/'
        return redirectWithCookies(response, new URL(next, request.url))
      }
      if (access === 'unauthorized') {
        return signOutRedirect(request, response, 'session_expired')
      }
      if (access === 'forbidden') {
        return signOutRedirect(request, response, 'client_required')
      }
    }
    return response
  }

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (accessToken) {
    const access = await verifyClientAccess(accessToken)
    if (access === 'unauthorized') {
      return signOutRedirect(request, response, 'session_expired')
    }
    if (access === 'forbidden') {
      return signOutRedirect(request, response, 'client_required')
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
