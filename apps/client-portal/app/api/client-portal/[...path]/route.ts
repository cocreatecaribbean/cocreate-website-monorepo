import { portalApiHeaders } from '@/lib/portal-api-headers'
import { proxyPortalApi } from '@/lib/portal-api-proxy'

async function handleProxy(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params
  const url = new URL(request.url)
  const nestPath = `/client-portal/${path.join('/')}${url.search}`
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
  const headers = await portalApiHeaders(hasBody)
  return proxyPortalApi(nestPath, headers, {
    method: request.method,
    body: hasBody ? await request.text() : undefined,
  })
}

export function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleProxy(request, context)
}

export function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleProxy(request, context)
}

export function PATCH(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleProxy(request, context)
}

export function PUT(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleProxy(request, context)
}

export function DELETE(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleProxy(request, context)
}
