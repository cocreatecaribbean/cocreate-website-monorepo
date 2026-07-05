import { nestApiUrl } from '@cocreate/api-client'
import { NextRequest, NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const headers = await adminApiHeaders()
  if (!headers) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
  }

  const { requestId } = await params
  const url = new URL(request.url)
  const query = url.searchParams.toString()
  const apiPath = query
    ? `/admin/project-requests/${requestId}/summary/export?${query}`
    : `/admin/project-requests/${requestId}/summary/export`

  try {
    const response = await fetch(nestApiUrl(apiPath), {
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({
        message: 'Could not export summary',
      }))
      return NextResponse.json(data, { status: response.status })
    }

    const buffer = await response.arrayBuffer()
    const disposition =
      response.headers.get('Content-Disposition') ??
      'attachment; filename="thread-summary.pdf"'
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
      },
    })
  } catch {
    return NextResponse.json(
      { message: 'Could not reach the API.' },
      { status: 503 },
    )
  }
}
