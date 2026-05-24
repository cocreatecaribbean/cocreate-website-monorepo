import type { NextRequest } from 'next/server'
import { completeAuthCallback } from '@/lib/supabase/route-handler'

const apiBase = () => process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function GET(request: NextRequest) {
  const result = await completeAuthCallback(request)

  if (!result.ok) {
    return result.response
  }

  try {
    await fetch(`${apiBase()}/client-portal/session/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: result.session.access_token }),
    })
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/callback] session/sync failed', err)
    }
  }

  return result.response
}
