import { NextResponse } from 'next/server'
import { nestApiUrl } from '@cocreate/api-client'

/** Proxy an authenticated request to the Nest API; returns 503 when the API is unreachable. */
export async function proxyPortalApi(
  path: string,
  headers: Record<string, string> | null,
  init?: RequestInit,
) {
  if (!headers) {
    return NextResponse.json({ ok: false, message: 'Not authenticated' }, { status: 401 })
  }

  try {
    const response = await fetch(nestApiUrl(path), {
      ...init,
      headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
      cache: 'no-store',
    })
    const data = await response.json().catch(() => ({
      ok: false,
      message: 'Invalid response from API',
    }))
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Could not reach the API. Ensure apps/api is running on port 3001.',
      },
      { status: 503 },
    )
  }
}
