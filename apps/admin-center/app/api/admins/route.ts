import { NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'

const apiBase = () => process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function GET() {
  const headers = await adminApiHeaders()
  if (!headers) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const response = await fetch(`${apiBase()}/admin/admins`, { headers, cache: 'no-store' })
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

export async function POST(request: Request) {
  const headers = await adminApiHeaders(true)
  if (!headers) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const response = await fetch(`${apiBase()}/admin/admins/invite`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
