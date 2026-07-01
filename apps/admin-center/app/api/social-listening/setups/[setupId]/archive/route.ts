import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ setupId: string }> },
) {
  const { setupId } = await params
  const headers = await adminApiHeaders()
  return proxyAdminApi(`/admin/social-listening/setups/${setupId}/archive`, headers, {
    method: 'POST',
  })
}
