import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

type RouteContext = {
  params: Promise<{ organizationId: string; userId: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const { organizationId, userId } = await context.params
  const headers = await adminApiHeaders(true)
  return proxyAdminApi(
    `/admin/clients/organizations/${organizationId}/team/${userId}/suspend`,
    headers,
    { method: 'POST' },
  )
}
