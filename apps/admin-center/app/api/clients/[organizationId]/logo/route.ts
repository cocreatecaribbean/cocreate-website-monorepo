import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await context.params
  const headers = await adminApiHeaders(true)
  const body = await request.text()
  return proxyAdminApi(`/admin/clients/${organizationId}/logo`, headers, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await context.params
  const headers = await adminApiHeaders(true)
  return proxyAdminApi(`/admin/clients/${organizationId}/logo`, headers, {
    method: 'DELETE',
  })
}
