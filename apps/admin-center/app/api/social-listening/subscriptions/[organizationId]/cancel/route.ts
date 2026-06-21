import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

type RouteContext = { params: Promise<{ organizationId: string }> }

export async function POST(request: Request, context: RouteContext) {
  const headers = await adminApiHeaders(true)
  const { organizationId } = await context.params
  const body = await request.json()
  return proxyAdminApi(
    `/admin/social-listening/subscriptions/${organizationId}/cancel`,
    headers,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
}
