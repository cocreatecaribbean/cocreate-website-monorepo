import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params
  const headers = await adminApiHeaders(true)
  const body = await request.json().catch(() => ({}))
  return proxyAdminApi(`/admin/clients/${organizationId}/inbox/mark-read`, headers, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
