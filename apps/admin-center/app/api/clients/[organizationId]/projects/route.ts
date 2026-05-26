import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params
  const headers = await adminApiHeaders(true)
  return proxyAdminApi(`/admin/clients/${organizationId}/projects`, headers)
}
