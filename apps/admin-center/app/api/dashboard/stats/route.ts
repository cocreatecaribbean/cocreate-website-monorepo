import { nestApiUrl } from '@cocreate/api-client'
import { NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'


export async function GET() {
  const headers = await adminApiHeaders(true)
  if (!headers) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const response = await fetch(nestApiUrl('/admin/dashboard/stats'), {
    headers,
    cache: 'no-store',
  })
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
