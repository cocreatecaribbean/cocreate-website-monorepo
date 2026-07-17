import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

type RouteContext = {
  params: Promise<{ organizationId: string; projectId: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const { organizationId, projectId } = await context.params
  const headers = await adminApiHeaders(true)
  const body = await request.json()
  return proxyAdminApi(
    `/admin/clients/organizations/${organizationId}/projects/${projectId}/owner`,
    headers,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
}
