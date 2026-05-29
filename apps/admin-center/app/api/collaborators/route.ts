import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function GET() {
  const headers = await adminApiHeaders()
  return proxyAdminApi('/admin/collaborators', headers)
}

export async function POST(request: Request) {
  const headers = await adminApiHeaders(true)
  const body = await request.text()
  return proxyAdminApi('/admin/collaborators', headers, {
    method: 'POST',
    body,
  })
}
