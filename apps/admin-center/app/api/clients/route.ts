import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function GET() {
  const headers = await adminApiHeaders(true)
  return proxyAdminApi('/admin/clients', headers)
}

export async function POST(request: Request) {
  const headers = await adminApiHeaders(true)
  const body = await request.json()
  return proxyAdminApi('/admin/clients/invite', headers, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
