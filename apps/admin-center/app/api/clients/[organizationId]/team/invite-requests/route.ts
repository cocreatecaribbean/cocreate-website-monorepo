import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

type RouteContext = { params: Promise<{ organizationId: string }> }

export async function GET(request: Request, context: RouteContext) {
  const { organizationId } = await context.params
  const headers = await adminApiHeaders(true)
  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return proxyAdminApi(
    `/admin/clients/organizations/${organizationId}/team/invite-requests${query}`,
    headers,
  )
}
