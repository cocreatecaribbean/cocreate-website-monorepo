import { nestApiUrl } from '@cocreate/api-client'
import { NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'


type RouteContext = { params: Promise<{ userId: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const headers = await adminApiHeaders()
  if (!headers) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { userId } = await context.params
  const response = await fetch(nestApiUrl(`/admin/admins/${userId}/suspend`), {
    method: 'POST',
    headers,
  })

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
