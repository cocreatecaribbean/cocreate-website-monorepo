import { nestApiUrl } from '@cocreate/api-client'
import { NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'
import { getApiErrorMessage } from '@/lib/api-error'


export async function GET() {
  const headers = await adminApiHeaders()
  if (!headers) {
    return NextResponse.json({ ok: false, message: 'Not authenticated' }, { status: 401 })
  }

  if ('x-admin-key' in headers) {
    return NextResponse.json({
      ok: true,
      mode: 'api_key',
      admin: null,
    })
  }

  try {
    const response = await fetch(nestApiUrl('/auth/admin/me'), {
      headers,
      cache: 'no-store',
    })
    const data = await response.json()
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
