import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

type RouteContext = {
  params: Promise<{ projectId: string; userId: string }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { projectId, userId } = await context.params
  const headers = await adminApiHeaders()
  return proxyAdminApi(
    `/admin/projects/${projectId}/collaborators/${userId}`,
    headers,
    { method: 'DELETE' },
  )
}
