import { nestApiUrl } from '@cocreate/api-client'
import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'
import type { SocialListeningAnalyticsPayload } from '@cocreate/api-contracts/v1/social-listening'
import { normalizeSocialListeningAnalytics } from '@cocreate/social-listening/core'

export async function fetchAdminSocialListeningAnalytics(
  organizationId: string,
): Promise<SocialListeningAnalyticsPayload | null> {
  const headers = await adminApiHeaders(false)
  if (!headers) return null

  const response = await fetch(
    nestApiUrl(`/admin/social-listening/organizations/${organizationId}/analytics`),
    { headers, cache: 'no-store' },
  )

  if (!response.ok) return null

  const json = (await response.json()) as SocialListeningAnalyticsPayload & { ok?: boolean }
  const data = normalizeSocialListeningAnalytics(json.data)
  if (!data) return null

  return { data, meta: json.meta }
}
