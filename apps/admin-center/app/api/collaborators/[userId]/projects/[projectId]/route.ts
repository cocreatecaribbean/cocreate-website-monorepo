import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

type RouteContext = { params: Promise<{ userId: string; projectId: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const { userId, projectId } = await context.params
  const headers = await adminApiHeaders(true)
  return proxyAdminApi(
    `/admin/collaborators/${userId}/projects/${projectId}`,
    headers,
    { method: 'POST' },
  )
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { userId, projectId } = await context.params
  const headers = await adminApiHeaders(true)
  return proxyAdminApi(
    `/admin/collaborators/${userId}/projects/${projectId}`,
    headers,
    { method: 'DELETE' },
  )
}
