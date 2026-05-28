import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const { assetId } = await params
  const headers = await adminApiHeaders(true)
  return proxyAdminApi(`/admin/brand-assets/${assetId}/download`, headers)
}
