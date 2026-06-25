import { nestApiUrl } from '@cocreate/api-client'
import { NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'


type RouteContext = { params: Promise<{ organizationId: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  const headers = await adminApiHeaders(true)
  if (!headers) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { organizationId } = await context.params
  const body = await request.json()

  const response = await fetch(
    nestApiUrl(`/admin/clients/organizations/${organizationId}/social-listening`),
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    },
  )

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
