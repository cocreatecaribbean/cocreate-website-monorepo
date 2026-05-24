import { getAccessToken } from '@/lib/supabase/server'

const apiBase = () => process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export type ClientPortalProfile = {
  user: {
    id: string
    email: string
    status: string
    role: string
  }
  organization: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    isSocialListeningSubscriber: boolean
  } | null
}

export async function fetchClientPortalProfile(): Promise<ClientPortalProfile | null> {
  const token = await getAccessToken()
  if (!token) return null

  const response = await fetch(`${apiBase()}/client-portal/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!response.ok) return null

  const data = (await response.json()) as ClientPortalProfile & { ok?: boolean }
  return {
    user: data.user,
    organization: data.organization,
  }
}
