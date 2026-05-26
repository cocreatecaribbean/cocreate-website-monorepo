import { NextRequest } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const headers = await adminApiHeaders(true)
  const body = await request.json()
  return proxyAdminApi(`/admin/settings/profile-options/${id}`, headers, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const headers = await adminApiHeaders(true)
  return proxyAdminApi(`/admin/settings/profile-options/${id}`, headers, {
    method: 'DELETE',
  })
}
