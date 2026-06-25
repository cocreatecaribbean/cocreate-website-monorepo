import { nestApiUrl } from '@cocreate/api-client'
import { NextRequest, NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'


export async function PATCH(request: NextRequest) {
  const headers = await adminApiHeaders(true)
  if (!headers) {
    return NextResponse.json({ ok: false, message: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const response = await fetch(nestApiUrl('/auth/admin/profile/avatar'), {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
