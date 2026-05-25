import { getAccessToken } from '@/lib/supabase/server'
import type { SocialListeningAnalytics } from '@/lib/social-listening/types'

const apiBase = () => process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export type SocialListeningAnalyticsPayload = {
  data: SocialListeningAnalytics
  meta: {
    source: 'brand24' | 'org_mock'
    organizationId: string
    brand24ProjectId: string | null
    fetchedAt: string
  }
}

export async function fetchSocialListeningAnalytics(): Promise<SocialListeningAnalyticsPayload | null> {
  const token = await getAccessToken()
  if (!token) return null

  const response = await fetch(`${apiBase()}/client-portal/social-listening/analytics`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!response.ok) return null

  const json = (await response.json()) as SocialListeningAnalyticsPayload & { ok?: boolean }
  if (!json.data) return null

  return {
    data: json.data,
    meta: json.meta,
  }
}
