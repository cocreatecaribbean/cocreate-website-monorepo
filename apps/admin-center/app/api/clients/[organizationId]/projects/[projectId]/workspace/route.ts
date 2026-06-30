import { nestApiUrl } from '@cocreate/api-client'
import { NextResponse } from 'next/server'
import { adminApiHeaders } from '@/lib/admin-api-headers'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string; projectId: string }> },
) {
  const { organizationId, projectId } = await params
  const headers = await adminApiHeaders(true)
  if (!headers) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const [projectRes, unreadRes] = await Promise.all([
    fetch(nestApiUrl(`/admin/projects/${projectId}?view=overview`), {
      headers,
      cache: 'no-store',
    }),
    fetch(nestApiUrl(`/admin/clients/${organizationId}/inbox/unread-count`), {
      headers,
      cache: 'no-store',
    }),
  ])

  const projectData = await projectRes.json().catch(() => null)
  if (!projectRes.ok) {
    return NextResponse.json(projectData ?? { error: 'Request failed' }, {
      status: projectRes.status,
    })
  }

  const unreadData = unreadRes.ok ? await unreadRes.json().catch(() => null) : null

  return NextResponse.json({
    project: projectData,
    clientName:
      typeof projectData?.organizationName === 'string' && projectData.organizationName
        ? projectData.organizationName
        : 'Client',
    unreadCount:
      typeof unreadData?.count === 'number' && Number.isFinite(unreadData.count)
        ? unreadData.count
        : 0,
  })
}
