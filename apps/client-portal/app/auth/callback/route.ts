import { nestApiUrl } from '@cocreate/api-client'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { completeAuthCallback } from '@/lib/supabase/route-handler'
import { ACTIVE_ORG_COOKIE } from '@/lib/api/active-organization'

export async function GET(request: NextRequest) {
  const organizationId =
    request.nextUrl.searchParams.get('organizationId')?.trim() || null

  const result = await completeAuthCallback(request)

  if (!result.ok) {
    return result.response
  }

  try {
    await fetch(nestApiUrl('/client-portal/session/sync'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: result.session.access_token,
        ...(organizationId ? { organizationId } : {}),
      }),
    })
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/callback] session/sync failed', err)
    }
  }

  const response = result.response
  if (!(response instanceof NextResponse) || !organizationId) {
    return response
  }

  const location = response.headers.get('location')
  if (location) {
    const out = NextResponse.redirect(new URL(location, request.url))
    response.cookies.getAll().forEach((c) => {
      out.cookies.set(c.name, c.value, {
        path: c.path,
        maxAge: c.maxAge,
        httpOnly: c.httpOnly,
        secure: c.secure,
        sameSite: c.sameSite as 'lax' | 'strict' | 'none' | undefined,
      })
    })
    out.cookies.set(ACTIVE_ORG_COOKIE, organizationId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
    return out
  }

  response.cookies.set(ACTIVE_ORG_COOKIE, organizationId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  return response
}
