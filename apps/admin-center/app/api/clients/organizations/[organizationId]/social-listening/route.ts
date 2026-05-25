import { NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'

const apiBase = () => process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type RouteContext = { params: Promise<{ organizationId: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  const headers = await adminApiHeaders(true)
  if (!headers) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { organizationId } = await context.params
  const body = await request.json()

  const response = await fetch(
    `${apiBase()}/admin/clients/organizations/${organizationId}/social-listening`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    },
  )

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
