import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

type RouteContext = {
  params: Promise<{ organizationId: string; userId: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const { organizationId, userId } = await context.params
  const headers = await adminApiHeaders(true)
  const body = await request.json()
  return proxyAdminApi(
    `/admin/clients/organizations/${organizationId}/team/${userId}`,
    headers,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { organizationId, userId } = await context.params
  const headers = await adminApiHeaders(true)
  return proxyAdminApi(
    `/admin/clients/organizations/${organizationId}/team/${userId}`,
    headers,
    { method: 'DELETE' },
  )
}
