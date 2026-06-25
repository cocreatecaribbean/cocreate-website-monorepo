import { nestApiUrl } from '@cocreate/api-client'
import { NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'


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
    nestApiUrl(`/admin/project-requests/${requestId}/realtime`),
    {
      method: 'GET',
      headers,
      cache: 'no-store',
    },
  )
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
