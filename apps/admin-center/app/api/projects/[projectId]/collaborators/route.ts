import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

type RouteContext = { params: Promise<{ projectId: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const { projectId } = await context.params
  const headers = await adminApiHeaders()
  return proxyAdminApi(`/admin/projects/${projectId}/collaborators`, headers)
}

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params
  const headers = await adminApiHeaders(true)
  const body = await request.text()
  return proxyAdminApi(`/admin/projects/${projectId}/collaborators`, headers, {
    method: 'POST',
    body,
  })
}
