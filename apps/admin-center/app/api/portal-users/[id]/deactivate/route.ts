import { nestApiUrl } from '@cocreate/api-client'
import { NextResponse } from 'next/server'

const adminKey = () => process.env.ADMIN_API_KEY ?? ''

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!adminKey()) {
    return NextResponse.json(
      { error: 'ADMIN_API_KEY is not configured' },
      { status: 500 },
    )
  }

  const { id } = await context.params
  const response = await fetch(
    nestApiUrl(`/admin/client-portal-users/${id}/deactivate`),
    {
      method: 'POST',
      headers: { 'x-admin-key': adminKey() },
    },
  )

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
