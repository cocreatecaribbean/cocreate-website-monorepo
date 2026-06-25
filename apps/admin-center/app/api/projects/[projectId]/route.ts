import { nestApiUrl } from '@cocreate/api-client'
import { NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'


export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  const headers = await adminApiHeaders(true)
  if (!headers) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const response = await fetch(nestApiUrl(`/admin/projects/${projectId}`), {
    headers,
    cache: 'no-store',
  })
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  const headers = await adminApiHeaders(true)
  if (!headers) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const response = await fetch(nestApiUrl(`/admin/projects/${projectId}`), {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
