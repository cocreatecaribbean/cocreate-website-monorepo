import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

type RouteContext = { params: Promise<{ userId: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const { userId } = await context.params
  const headers = await adminApiHeaders(true)
  return proxyAdminApi(`/admin/collaborators/${userId}/resend-invite`, headers, {
    method: 'POST',
  })
}
