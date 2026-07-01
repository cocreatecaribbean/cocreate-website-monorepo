'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const TOKEN_TTL_MS = 30_000

let cachedToken: string | null = null
let cachedAt = 0

export function clearPortalAccessTokenCache(): void {
  cachedToken = null
  cachedAt = 0
}

export async function getPortalAccessToken(): Promise<string | null> {
  const now = Date.now()
  if (cachedToken && now - cachedAt < TOKEN_TTL_MS) {
    return cachedToken
  }

  const supabase = createSupabaseBrowserClient()
  const { data } = await supabase.auth.getSession()
  cachedToken = data.session?.access_token ?? null
  cachedAt = now
  return cachedToken
}
