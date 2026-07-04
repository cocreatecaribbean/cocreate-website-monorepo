import { nestApiUrl } from '@cocreate/api-client'
import { NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'
import { getApiErrorMessage } from '@/lib/api-error'

export async function PATCH(request: Request) {
  const headers = await adminApiHeaders()
  if (!headers) {
    return NextResponse.json({ ok: false, message: 'Not authenticated' }, { status: 401 })
  }

  if ('x-admin-key' in headers) {
    return NextResponse.json(
      { ok: false, message: 'Preferences require a signed-in user.' },
      { status: 400 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const response = await fetch(nestApiUrl('/auth/admin/preferences'), {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: getApiErrorMessage(null, 'Could not reach the API'),
      },
      { status: 503 },
    )
  }
}
