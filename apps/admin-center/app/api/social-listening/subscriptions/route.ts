import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function GET(request: Request) {
  const headers = await adminApiHeaders(true)
  const url = new URL(request.url)
  const query = url.searchParams.toString()
  const path = query
    ? `/admin/social-listening/subscriptions?${query}`
    : '/admin/social-listening/subscriptions'
  return proxyAdminApi(path, headers)
}

export async function POST(request: Request) {
  const headers = await adminApiHeaders(true)
  const body = await request.json()
  return proxyAdminApi('/admin/social-listening/subscriptions', headers, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
