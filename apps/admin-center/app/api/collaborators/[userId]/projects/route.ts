import { NextRequest } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

type RouteContext = {
  params: Promise<{ userId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { userId } = await context.params
  const headers = await adminApiHeaders()
  const body = await request.text()
  return proxyAdminApi(`/admin/collaborators/${userId}/projects`, headers, {
    method: 'PATCH',
    body,
    headers: { 'Content-Type': 'application/json' },
  })
}
