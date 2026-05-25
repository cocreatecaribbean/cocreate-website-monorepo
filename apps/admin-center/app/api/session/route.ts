import { NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'
import { getApiErrorMessage } from '@/lib/api-error'

const apiBase = () =>
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

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
    const response = await fetch(`${apiBase()}/auth/admin/me`, {
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
