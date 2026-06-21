import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function GET(request: Request) {
  const headers = await adminApiHeaders(true)
  const url = new URL(request.url)
  const query = url.searchParams.toString()
  const path = query ? `/admin/social-listening/setups?${query}` : '/admin/social-listening/setups'
  return proxyAdminApi(path, headers)
}

export async function POST(request: Request) {
  const headers = await adminApiHeaders(true)
  const body = await request.json()
  return proxyAdminApi('/admin/social-listening/setups', headers, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
