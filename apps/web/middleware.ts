import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const STUDIO_ORIGIN_PATTERNS = [
  /^https:\/\/hq\.cocreatecaribbean\.com$/,
  /^https:\/\/hq-dev\.cocreatecaribbean\.com$/,
  /^https:\/\/[a-z0-9-]+\.sanity\.studio$/,
  /^http:\/\/localhost:3333$/,
]

function isStudioReferer(referer: string | null): boolean {
  if (!referer) return false

  try {
    const origin = new URL(referer).origin
    return STUDIO_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin))
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
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
