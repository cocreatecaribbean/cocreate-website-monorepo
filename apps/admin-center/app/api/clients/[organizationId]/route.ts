import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function GET(
  _request: Request,
  context: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await context.params
  const headers = await adminApiHeaders(true)
  return proxyAdminApi(`/admin/clients/${organizationId}`, headers)
}
