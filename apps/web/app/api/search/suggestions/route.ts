import { NextRequest, NextResponse } from 'next/server'
import { getWorkProjects } from '@/lib/search/site-search'
import { buildSearchSuggestions } from '@/lib/search/search-site'

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get('limit')
  const limit = limitParam ? Math.min(Number(limitParam) || 8, 16) : 8

  const projects = await getWorkProjects()
  const suggestions = buildSearchSuggestions(projects, limit)

  return NextResponse.json(suggestions)
}
