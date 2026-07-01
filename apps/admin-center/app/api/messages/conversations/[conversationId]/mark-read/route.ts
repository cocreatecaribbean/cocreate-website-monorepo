import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params
  const headers = await adminApiHeaders()
  return proxyAdminApi(`/admin/inbox/conversations/${conversationId}/mark-read`, headers, {
    method: 'POST',
  })
}
