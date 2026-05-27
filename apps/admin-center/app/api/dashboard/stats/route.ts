import { NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'

const apiBase = () =>
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function GET() {
  const headers = await adminApiHeaders(true)
  if (!headers) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const response = await fetch(`${apiBase()}/admin/dashboard/stats`, {
    headers,
    cache: 'no-store',
  })
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
