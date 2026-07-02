import { portalApiHeaders } from '@/lib/portal-api-headers'
import { proxyPortalApi } from '@/lib/portal-api-proxy'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const { attachmentId } = await params
  const headers = await portalApiHeaders()
  if (!headers) {
    return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 })
  }

  const messageId = new URL(request.url).searchParams.get('messageId')?.trim()
  const query = messageId ? `?messageId=${encodeURIComponent(messageId)}` : ''

  return proxyPortalApi(`/client-portal/attachments/${attachmentId}${query}`, headers, {
    method: 'DELETE',
  })
}
