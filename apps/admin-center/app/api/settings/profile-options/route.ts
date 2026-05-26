import { NextRequest } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function GET() {
  const headers = await adminApiHeaders(true)
  return proxyAdminApi('/admin/settings/profile-options', headers)
}

export async function POST(request: NextRequest) {
  const headers = await adminApiHeaders(true)
  const body = await request.json()
  return proxyAdminApi('/admin/settings/profile-options', headers, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
