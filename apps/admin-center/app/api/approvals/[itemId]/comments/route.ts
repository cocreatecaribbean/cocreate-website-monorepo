import { NextRequest } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params
  const headers = await adminApiHeaders(true)
  if (!headers) {
    return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 })
  }
  return proxyAdminApi(`/admin/approvals/${itemId}/comments`, headers)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params
  const headers = await adminApiHeaders(true)
  if (!headers) {
    return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 })
  }
  const body = await request.json()
  return proxyAdminApi(`/admin/approvals/${itemId}/comments`, headers, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
