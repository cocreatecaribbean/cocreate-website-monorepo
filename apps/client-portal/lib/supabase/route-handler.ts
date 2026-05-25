import type { CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType, Session } from '@supabase/supabase-js'
import { createSupabaseServerClientWithCookies } from '@/lib/supabase/create-server-client'

function normalizeOtpType(type: string): EmailOtpType {
  if (type === 'magiclink') return 'email'
  return type as EmailOtpType
}

function safeNextPath(next: string | null) {
  const path = next ?? '/'
  if (!path.startsWith('/') || path.startsWith('//')) return '/'
  return path
}

export function createSupabaseRouteHandlerClient(
  request: NextRequest,
  redirectTo: URL,
) {
  let response = NextResponse.redirect(redirectTo)

  const supabase = createSupabaseServerClientWithCookies(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  )

  return { supabase, response }
}

export async function completeAuthCallback(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash') ?? searchParams.get('token')
  const rawType = searchParams.get('type')
  const otpType = rawType ? normalizeOtpType(rawType) : null
  const next = safeNextPath(searchParams.get('next'))

  const successUrl = new URL(next, origin)
  const failUrl = new URL('/login?error=auth', origin)

  const { supabase, response } = createSupabaseRouteHandlerClient(
    request,
    successUrl,
  )

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.session) {
      return {
        ok: true as const,
        response,
        session: data.session,
        origin,
        next,
      }
    }
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/callback] exchangeCodeForSession failed', error?.message)
    }
  } else if (tokenHash && otpType) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    })
    if (!error && data.session) {
      return {
        ok: true as const,
        response,
        session: data.session,
        origin,
        next,
      }
    }
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/callback] verifyOtp failed', error?.message, {
        type: otpType,
      })
    }
  } else if (process.env.NODE_ENV === 'development') {
    console.error('[auth/callback] missing code or token_hash/type', {
      query: searchParams.toString(),
    })
  }

  const { response: failResponse } = createSupabaseRouteHandlerClient(
    request,
    failUrl,
  )

  return { ok: false as const, response: failResponse, origin }
}

export type AuthCallbackSuccess = {
  ok: true
  response: NextResponse
  session: Session
  origin: string
  next: string
}
