import { NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'
import { adminApiBase } from '@/lib/admin-api-proxy'

type RouteContext = { params: Promise<{ organizationId: string }> }

export async function POST(request: Request, context: RouteContext) {
  const headers = await adminApiHeaders(true)
  if (!headers) {
    return NextResponse.json({ ok: false, message: 'Not authenticated' }, { status: 401 })
  }

  const { organizationId } = await context.params
  const url = new URL(request.url)
  const query = url.searchParams.toString()
  const apiPath = query
    ? `/admin/social-listening/organizations/${organizationId}/reports/generate?${query}`
    : `/admin/social-listening/organizations/${organizationId}/reports/generate`

  try {
    const response = await fetch(`${adminApiBase()}${apiPath}`, {
      method: 'POST',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({
        ok: false,
        message: 'Could not generate report',
      }))
      return NextResponse.json(data, { status: response.status })
    }

    const buffer = await response.arrayBuffer()
    const disposition = response.headers.get('Content-Disposition') ?? 'attachment; filename="report.pdf"'
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
      },
    })
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Could not reach the API.' },
      { status: 503 },
    )
  }
}
