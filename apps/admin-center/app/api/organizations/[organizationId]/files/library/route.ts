import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  const { organizationId } = await params
  const headers = await adminApiHeaders()
  if (!headers) {
    return Response.json({ ok: false, message: 'Not authenticated' }, { status: 401 })
  }
  const url = new URL(request.url)
  const query = url.searchParams.toString()
  const suffix = query ? `?${query}` : ''
  return proxyAdminApi(
    `/admin/organizations/${organizationId}/files/library${suffix}`,
    headers,
  )
}
