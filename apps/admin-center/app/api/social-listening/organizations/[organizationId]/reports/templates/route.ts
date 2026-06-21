import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

type RouteContext = { params: Promise<{ organizationId: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const headers = await adminApiHeaders(true)
  const { organizationId } = await context.params
  return proxyAdminApi(
    `/admin/social-listening/organizations/${organizationId}/reports/templates`,
    headers,
  )
}
