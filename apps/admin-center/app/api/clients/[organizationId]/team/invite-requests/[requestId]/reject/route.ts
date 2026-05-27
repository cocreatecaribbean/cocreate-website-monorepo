import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

type RouteContext = {
  params: Promise<{ organizationId: string; requestId: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const { organizationId, requestId } = await context.params
  const headers = await adminApiHeaders(true)
  const body = await request.json().catch(() => ({}))
  return proxyAdminApi(
    `/admin/clients/organizations/${organizationId}/team/invite-requests/${requestId}/reject`,
    headers,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
}
