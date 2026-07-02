import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const { attachmentId } = await params
  const headers = await adminApiHeaders(true)
  if (!headers) {
    return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 })
  }

  const messageId = new URL(request.url).searchParams.get('messageId')?.trim()
  const query = messageId ? `?messageId=${encodeURIComponent(messageId)}` : ''

  return proxyAdminApi(`/admin/attachments/${attachmentId}${query}`, headers, {
    method: 'DELETE',
  })
}
