import { getAccessToken } from '@/lib/supabase/server'
import type { SocialListeningAnalyticsPayload } from '@/lib/social-listening/api-types'
import { normalizeSocialListeningAnalytics } from '@/lib/social-listening/normalize-analytics'

const apiBase = () =>
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/** Server-only: initial Social Listening load in app/page.tsx */
export async function fetchSocialListeningAnalytics(): Promise<SocialListeningAnalyticsPayload | null> {
  const token = await getAccessToken()
  if (!token) return null

  const response = await fetch(`${apiBase()}/client-portal/social-listening/analytics`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!response.ok) return null

  const json = (await response.json()) as SocialListeningAnalyticsPayload & { ok?: boolean }
  const data = normalizeSocialListeningAnalytics(json.data)
  if (!data) return null

  return { data, meta: json.meta }
}
