import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function POST(
  _request: Request,
  {
    params,
  }: { params: Promise<{ organizationId: string; projectId: string }> },
) {
  const { organizationId, projectId } = await params
  const headers = await adminApiHeaders(true)
  return proxyAdminApi(
    `/admin/clients/${organizationId}/projects/${projectId}/approve`,
    headers,
    { method: 'POST' },
  )
}
