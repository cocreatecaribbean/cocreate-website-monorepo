import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

type RouteContext = { params: Promise<{ organizationId: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const { organizationId } = await context.params
  const headers = await adminApiHeaders(true)
  return proxyAdminApi(`/admin/clients/organizations/${organizationId}/team`, headers)
}

export async function POST(request: Request, context: RouteContext) {
  const { organizationId } = await context.params
  const headers = await adminApiHeaders(true)
  const body = await request.json()
  return proxyAdminApi(
    `/admin/clients/organizations/${organizationId}/team/invite`,
    headers,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
}
