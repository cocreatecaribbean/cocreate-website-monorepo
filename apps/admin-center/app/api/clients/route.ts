import { NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'

const apiBase = () => process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const adminKey = () => process.env.ADMIN_API_KEY ?? ''

async function adminHeaders() {
  const token = await getAccessToken()
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  // Dev fallback when Supabase Auth keys are not set yet
  if (!isSupabaseConfigured() && adminKey()) {
    return {
      'x-admin-key': adminKey(),
      'Content-Type': 'application/json',
    }
  }

  return null
}

export async function GET() {
  const headers = await adminHeaders()
  if (!headers) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const response = await fetch(`${apiBase()}/admin/clients`, {
    headers,
    cache: 'no-store',
  })

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

export async function POST(request: Request) {
  const headers = await adminHeaders()
  if (!headers) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const response = await fetch(`${apiBase()}/admin/clients/invite`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
