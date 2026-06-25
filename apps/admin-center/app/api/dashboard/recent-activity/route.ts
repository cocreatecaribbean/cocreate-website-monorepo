import { nestApiUrl } from '@cocreate/api-client'
import { NextRequest, NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'


export async function GET(request: NextRequest) {
  const headers = await adminApiHeaders(true)
  if (!headers) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const limit = request.nextUrl.searchParams.get('limit') ?? '15'
  const response = await fetch(
    nestApiUrl(`/admin/dashboard/recent-activity?limit=${encodeURIComponent(limit)}`),
    { headers, cache: 'no-store' },
  )
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
