import { validatePreviewUrl } from '@sanity/preview-url-secret'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { getSanityClientWithToken } from '@/lib/server/sanity'

export const dynamic = 'force-dynamic'

function resolveRedirectTo(request: NextRequest, redirectTo?: string): string {
  if (redirectTo) {
    return redirectTo
  }

  const pathnameParam = request.nextUrl.searchParams.get('sanity-preview-pathname')
  if (pathnameParam) {
    try {
      const redirectUrl = new URL(pathnameParam, request.nextUrl.origin)
      return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`
    } catch {
      return pathnameParam.startsWith('/') ? pathnameParam : `/${pathnameParam}`
    }
  }

  const referer = request.headers.get('referer')
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      if (refererUrl.origin === request.nextUrl.origin) {
        return `${refererUrl.pathname}${refererUrl.search}${refererUrl.hash}`
      }
    } catch {
      // ignore invalid referer
    }
  }

  return '/work'
}

export async function GET(request: NextRequest) {
  let client
  try {
    client = getSanityClientWithToken()
  } catch {
    return new Response('Preview validation is not configured', { status: 500 })
  }

  const { isValid, redirectTo } = await validatePreviewUrl(client, request.url)

  if (!isValid) {
    if (process.env.NODE_ENV === 'development') {
      const { projectId: sanityProjectId, dataset } = client.config()
      console.warn('[preview] validatePreviewUrl failed', {
        projectId: sanityProjectId,
        dataset,
        hint:
          'Preview secret must exist in the same dataset Studio uses. Local dev: pnpm dev:studio (dev) — not hosted Production Studio against localhost.',
      })
    }

    return new Response('Invalid or expired preview secret', { status: 401 })
  }

  const draft = await draftMode()
  draft.enable()

  redirect(resolveRedirectTo(request, redirectTo))
}
