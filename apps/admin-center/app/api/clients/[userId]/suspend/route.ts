import { NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'

const apiBase = () => process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const adminKey = () => process.env.ADMIN_API_KEY ?? ''

type RouteContext = { params: Promise<{ userId: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const token = await getAccessToken()
  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : !isSupabaseConfigured() && adminKey()
      ? { 'x-admin-key': adminKey() }
      : null

  if (!headers) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { userId } = await context.params
  const response = await fetch(`${apiBase()}/admin/clients/${userId}/suspend`, {
    method: 'POST',
    headers,
  })

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
