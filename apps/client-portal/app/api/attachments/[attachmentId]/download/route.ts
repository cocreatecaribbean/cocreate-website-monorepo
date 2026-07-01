import { portalApiHeaders } from '@/lib/portal-api-headers'
import { proxyPortalApi } from '@/lib/portal-api-proxy'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const { attachmentId } = await params
  const headers = await portalApiHeaders()
  if (!headers) {
    return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 })
  }
  return proxyPortalApi(
    `/client-portal/attachments/${attachmentId}/download`,
    headers,
  )
}
