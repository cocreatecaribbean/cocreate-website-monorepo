import { NextRequest } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params
  const headers = await adminApiHeaders()
  const body = await request.text()
  return proxyAdminApi(
    `/admin/inbox/conversations/${conversationId}/attachments/upload-url`,
    headers,
    {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}
