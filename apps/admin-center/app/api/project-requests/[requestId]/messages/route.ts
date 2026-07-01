import { nestApiUrl } from '@cocreate/api-client'
import { NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'


export async function GET(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params
  const headers = await adminApiHeaders(true)
  if (!headers) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const query = new URL(request.url).search
  const response = await fetch(
    nestApiUrl(`/admin/project-requests/${requestId}/messages${query}`),
    {
      headers,
      cache: 'no-store',
    },
  )
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params
  const headers = await adminApiHeaders(true)
  if (!headers) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const response = await fetch(
    nestApiUrl(`/admin/project-requests/${requestId}/messages`),
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    },
  )
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
