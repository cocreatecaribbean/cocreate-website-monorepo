import { nestApiUrl } from '@cocreate/api-client'
import { getAccessToken } from '@client-portal/lib/supabase/server'
import type { SocialListeningAnalyticsPayload } from '@cocreate/api-contracts/v1/social-listening'
import { normalizeSocialListeningAnalytics } from '@cocreate/social-listening/core'


/** Server-only: initial Social Listening load in app/page.tsx */
export async function fetchSocialListeningAnalytics(): Promise<SocialListeningAnalyticsPayload | null> {
  const token = await getAccessToken()
  if (!token) return null

  const response = await fetch(nestApiUrl('/client-portal/social-listening/analytics'), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!response.ok) return null

  const json = (await response.json()) as SocialListeningAnalyticsPayload & { ok?: boolean }
  const data = normalizeSocialListeningAnalytics(json.data)
  if (!data) return null

  return { data, meta: json.meta }
}
