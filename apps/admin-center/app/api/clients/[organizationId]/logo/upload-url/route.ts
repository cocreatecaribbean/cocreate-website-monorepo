import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function POST(
  request: Request,
  context: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await context.params
  const headers = await adminApiHeaders(true)
  const body = await request.text()
  return proxyAdminApi(`/admin/clients/${organizationId}/logo/upload-url`, headers, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}
