import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** joh-style studio origins + configured Studio URL */
const STUDIO_ORIGIN_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.sanity\.studio$/,
  /^http:\/\/localhost:3333$/,
]

function configuredStudioOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL?.trim()
  if (!raw) return null
  try {
    return new URL(raw).origin
  } catch {
    return null
  }
}

function isStudioReferer(referer: string | null): boolean {
  if (!referer) return false

  try {
    const origin = new URL(referer).origin
    const configured = configuredStudioOrigin()
    if (configured && origin === configured) return true
    return STUDIO_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin))
  } catch {
    return false
  }
}

/**
 * joh dual gate: leftover draft cookie alone stays published.
 * Draft SSR only when draft cookie + (iframe OR Studio referer).
 */
export function proxy(request: NextRequest) {
  const hasDraftCookie = request.cookies.has('__prerender_bypass')
  const isIframe = request.headers.get('sec-fetch-dest') === 'iframe'
  const fromStudio = isStudioReferer(request.headers.get('referer'))

  if (hasDraftCookie && (isIframe || fromStudio)) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-preview-context', 'embedded')

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
