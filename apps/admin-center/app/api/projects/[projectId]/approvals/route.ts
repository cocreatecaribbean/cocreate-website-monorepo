import { NextRequest } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  const headers = await adminApiHeaders(true)
  if (!headers) {
    return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 })
  }
  const status = request.nextUrl.searchParams.get('status')
  const includeComments = request.nextUrl.searchParams.get('includeComments')
  const searchParams = new URLSearchParams()
  if (status) searchParams.set('status', status)
  if (includeComments === 'true') searchParams.set('includeComments', 'true')
  const query = searchParams.size > 0 ? `?${searchParams.toString()}` : ''
  return proxyAdminApi(`/admin/projects/${projectId}/approvals${query}`, headers)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  const headers = await adminApiHeaders(true)
  if (!headers) {
    return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 })
  }
  const body = await request.json()
  return proxyAdminApi(`/admin/projects/${projectId}/approvals`, headers, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
