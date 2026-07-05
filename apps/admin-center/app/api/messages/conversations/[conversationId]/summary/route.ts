import { NextRequest } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params
  const headers = await adminApiHeaders()
  const url = new URL(request.url)
  const query = url.searchParams.toString()
  const apiPath = query
    ? `/admin/inbox/conversations/${conversationId}/summary?${query}`
    : `/admin/inbox/conversations/${conversationId}/summary`
  return proxyAdminApi(apiPath, headers, { method: 'POST' })
}
