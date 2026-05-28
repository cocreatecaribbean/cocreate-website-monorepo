import { NextRequest } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params
  const headers = await adminApiHeaders(true)
  return proxyAdminApi(`/admin/organizations/${organizationId}/brand-assets`, headers)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params
  const headers = await adminApiHeaders(true)
  const body = await request.json()
  return proxyAdminApi(`/admin/organizations/${organizationId}/brand-assets`, headers, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
