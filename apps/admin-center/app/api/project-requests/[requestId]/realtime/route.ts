import { NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'

const apiBase = () => process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params
  const headers = await adminApiHeaders()
  if (!headers) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const response = await fetch(
    `${apiBase()}/admin/project-requests/${requestId}/realtime`,
    {
      method: 'GET',
      headers,
      cache: 'no-store',
    },
  )
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
