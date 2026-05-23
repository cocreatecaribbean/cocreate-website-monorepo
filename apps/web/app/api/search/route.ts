import { NextRequest, NextResponse } from 'next/server'
import { searchSite } from '@/lib/search/static-search'

export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? ''
  const limitParam = request.nextUrl.searchParams.get('limit')
  const limit = limitParam ? Math.min(Number(limitParam) || 12, 24) : 12

  const results = searchSite(query, limit)

  return NextResponse.json({ query, results })
}
