import { nestApiUrl } from '@cocreate/api-client'
import { NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'
import { getApiErrorMessage } from '@/lib/api-error'

export async function POST() {
  const headers = await adminApiHeaders()
  if (!headers) {
    return NextResponse.json({ ok: false, message: 'Not authenticated' }, { status: 401 })
  }

  try {
    const response = await fetch(nestApiUrl('/auth/admin/presence'), {
      method: 'POST',
      headers,
      cache: 'no-store',
    })
    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: getApiErrorMessage(
          null,
          'Could not reach the API. Ensure apps/api is running on port 3001.',
        ),
      },
      { status: 503 },
    )
  }
}
