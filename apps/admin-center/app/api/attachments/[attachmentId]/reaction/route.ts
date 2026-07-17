import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const { attachmentId } = await params
  const headers = await adminApiHeaders()
  if (!headers) {
    return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 })
  }
  const body = await request.text()
  return proxyAdminApi(`/admin/attachments/${attachmentId}/reaction`, headers, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const { attachmentId } = await params
  const headers = await adminApiHeaders()
  if (!headers) {
    return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 })
  }
  return proxyAdminApi(`/admin/attachments/${attachmentId}/reaction`, headers, {
    method: 'DELETE',
  })
}
