import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

type RouteContext = { params: Promise<{ organizationId: string }> }

export async function GET(request: Request, context: RouteContext) {
  const headers = await adminApiHeaders(true)
  const { organizationId } = await context.params
  const url = new URL(request.url)
  const query = url.searchParams.toString()
  const path = query
    ? `/admin/social-listening/organizations/${organizationId}/analytics/snapshots?${query}`
    : `/admin/social-listening/organizations/${organizationId}/analytics/snapshots`
  return proxyAdminApi(path, headers)
}
