import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

type RouteContext = {
  params: Promise<{ organizationId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { organizationId } = await context.params
  const headers = await adminApiHeaders()
  return proxyAdminApi(`/admin/inbox/clients/${organizationId}/conversations`, headers)
}
