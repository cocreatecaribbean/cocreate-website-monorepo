import { nestApiUrl } from '@cocreate/api-client'
import type { NextRequest } from 'next/server'
import { completeAuthCallback } from '@/lib/supabase/route-handler'


export async function GET(request: NextRequest) {
  const result = await completeAuthCallback(request)

  if (!result.ok) {
    return result.response
  }

  try {
    await fetch(nestApiUrl('/client-portal/session/sync'), {
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
