import { NextRequest } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params
  const headers = await adminApiHeaders()
  const url = new URL(request.url)
  const query = url.searchParams.toString()
  const apiPath = query
    ? `/admin/project-requests/${requestId}/summary?${query}`
    : `/admin/project-requests/${requestId}/summary`
  return proxyAdminApi(apiPath, headers, { method: 'POST' })
}
