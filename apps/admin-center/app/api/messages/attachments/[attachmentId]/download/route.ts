import { NextRequest } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const { attachmentId } = await params
  const headers = await adminApiHeaders()
  return proxyAdminApi(`/admin/inbox/attachments/${attachmentId}/download`, headers)
}
