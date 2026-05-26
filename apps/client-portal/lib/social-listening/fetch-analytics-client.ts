'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type {
  SocialListeningAnalyticsPayload,
  SocialListeningComparePayload,
} from '@/lib/social-listening/api-types'

const apiBase = () =>
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function getBrowserAccessToken(): Promise<string | null> {
  const supabase = createSupabaseBrowserClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function socialListeningFetch<T>(path: string): Promise<T | null> {
  const token = await getBrowserAccessToken()
  if (!token) return null

  const response = await fetch(`${apiBase()}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!response.ok) return null
  return (await response.json()) as T
}

export async function fetchSocialListeningAnalyticsWithStatus(options?: {
  asOf?: string
}): Promise<
  | { status: 'ok'; payload: SocialListeningAnalyticsPayload }
  | { status: 'not_found' }
  | { status: 'error' }
> {
  const token = await getBrowserAccessToken()
  if (!token) return { status: 'error' }

  const query = options?.asOf ? `?asOf=${encodeURIComponent(options.asOf)}` : ''
  const response = await fetch(
    `${apiBase()}/client-portal/social-listening/analytics${query}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  )

  if (response.status === 404) return { status: 'not_found' }
  if (!response.ok) return { status: 'error' }

  const json = (await response.json()) as SocialListeningAnalyticsPayload & {
    ok?: boolean
  }
  if (!json?.data) return { status: 'error' }
  return { status: 'ok', payload: { data: json.data, meta: json.meta } }
}

export async function fetchSocialListeningSnapshotDates(): Promise<string[]> {
  const json = await socialListeningFetch<{ ok?: boolean; dates?: string[] }>(
    '/client-portal/social-listening/analytics/snapshots',
  )
  return json?.dates ?? []
}

export async function fetchSocialListeningCompare(options: {
  baseline: string
  current?: string
}): Promise<SocialListeningComparePayload | null> {
  const params = new URLSearchParams({ baseline: options.baseline })
  if (options.current) params.set('current', options.current)
  const json = await socialListeningFetch<
    SocialListeningComparePayload & { ok?: boolean }
  >(`/client-portal/social-listening/analytics/compare?${params.toString()}`)

  if (!json?.baseline?.data || !json?.current?.data) return null
  return {
    baseline: json.baseline,
    current: json.current,
    deltas: json.deltas,
  }
}
