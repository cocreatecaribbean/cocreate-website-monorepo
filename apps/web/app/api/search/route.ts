import { NextRequest, NextResponse } from 'next/server'
import { searchSite } from '@/lib/search/site-search'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? ''
  const limitParam = request.nextUrl.searchParams.get('limit')
  const limit = limitParam ? Math.min(Number(limitParam) || 12, 24) : 12

  const results = await searchSite(query, limit)

  return NextResponse.json({ query, results })
}
