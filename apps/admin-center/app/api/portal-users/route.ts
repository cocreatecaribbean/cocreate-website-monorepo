import { nestApiUrl } from '@cocreate/api-client'
import { NextResponse } from 'next/server'

const adminKey = () => process.env.ADMIN_API_KEY ?? ''

export async function GET() {
  if (!adminKey()) {
    return NextResponse.json(
      { error: 'ADMIN_API_KEY is not configured' },
      { status: 500 },
    )
  }

  const response = await fetch(nestApiUrl('/admin/client-portal-users'), {
    headers: { 'x-admin-key': adminKey() },
    cache: 'no-store',
  })

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

export async function POST(request: Request) {
  if (!adminKey()) {
    return NextResponse.json(
      { error: 'ADMIN_API_KEY is not configured' },
      { status: 500 },
    )
  }

  const body = await request.json()
  const response = await fetch(nestApiUrl('/admin/client-portal-users'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey(),
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
