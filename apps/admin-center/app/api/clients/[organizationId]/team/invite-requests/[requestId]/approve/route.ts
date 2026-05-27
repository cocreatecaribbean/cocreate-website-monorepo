import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

type RouteContext = {
  params: Promise<{ organizationId: string; requestId: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const { organizationId, requestId } = await context.params
  const headers = await adminApiHeaders(true)
  return proxyAdminApi(
    `/admin/clients/organizations/${organizationId}/team/invite-requests/${requestId}/approve`,
    headers,
    { method: 'POST' },
  )
}
