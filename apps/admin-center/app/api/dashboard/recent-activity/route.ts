import { NextRequest, NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'

const apiBase = () =>
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function GET(request: NextRequest) {
  const headers = await adminApiHeaders(true)
  if (!headers) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const limit = request.nextUrl.searchParams.get('limit') ?? '15'
  const response = await fetch(
    `${apiBase()}/admin/dashboard/recent-activity?limit=${encodeURIComponent(limit)}`,
    { headers, cache: 'no-store' },
  )
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
