import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function GET() {
  const headers = await adminApiHeaders(true)
  return proxyAdminApi('/admin/social-listening/stats', headers)
}
