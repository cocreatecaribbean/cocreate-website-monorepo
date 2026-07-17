import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

type RouteContext = {
  params: Promise<{ organizationId: string; projectId: string; userId: string }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { organizationId, projectId, userId } = await context.params
  const headers = await adminApiHeaders(true)
  return proxyAdminApi(
    `/admin/clients/organizations/${organizationId}/projects/${projectId}/members/${userId}`,
    headers,
    { method: 'DELETE' },
  )
}
