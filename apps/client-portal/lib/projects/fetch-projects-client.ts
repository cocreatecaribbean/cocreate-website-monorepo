'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type {
  ClientProjectDetail,
  ClientProjectSummary,
  PortalNotificationItem,
  ProjectRequestItem,
  ProjectRequestMessage,
} from '@/lib/projects/api-types'

const apiBase = () =>
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function getBrowserAccessToken(): Promise<string | null> {
  const supabase = createSupabaseBrowserClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function portalFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const token = await getBrowserAccessToken()
  if (!token) {
    return { ok: false, status: 401, message: 'Not signed in' }
  }

  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'message' in data
        ? String((data as { message: unknown }).message)
        : `Request failed (${response.status})`
    return { ok: false, status: response.status, message }
  }

  return { ok: true, data: data as T }
}

export async function fetchProjects(): Promise<ClientProjectSummary[]> {
  const result = await portalFetch<ClientProjectSummary[]>('/client-portal/projects')
  return result.ok ? result.data : []
}

export async function fetchProject(id: string): Promise<ClientProjectDetail | null> {
  const result = await portalFetch<ClientProjectDetail>(`/client-portal/projects/${id}`)
  return result.ok ? result.data : null
}

export async function createProject(payload: {
  title: string
  description: string
}): Promise<{ ok: boolean; project?: ClientProjectSummary; message?: string }> {
  const result = await portalFetch<ClientProjectSummary>('/client-portal/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!result.ok) return { ok: false, message: result.message }
  return { ok: true, project: result.data }
}

export async function fetchOpenApprovals(): Promise<ProjectRequestItem[]> {
  const result = await portalFetch<ProjectRequestItem[]>(
    '/client-portal/projects/requests/open',
  )
  return result.ok ? result.data : []
}

export async function createChangeRequest(
  projectId: string,
  payload: { title: string; description: string },
) {
  return portalFetch<ProjectRequestItem>(
    `/client-portal/projects/${projectId}/change-requests`,
    { method: 'POST', body: JSON.stringify(payload) },
  )
}

export async function createPhaseApproval(
  projectId: string,
  payload: { targetPhase: string; description?: string },
) {
  return portalFetch<ProjectRequestItem>(
    `/client-portal/projects/${projectId}/phase-approvals`,
    { method: 'POST', body: JSON.stringify(payload) },
  )
}

export async function fetchRequestThread(requestId: string) {
  return portalFetch<ProjectRequestItem>(`/client-portal/project-requests/${requestId}`)
}

export async function sendRequestMessage(requestId: string, body: string) {
  return portalFetch<ProjectRequestMessage>(
    `/client-portal/project-requests/${requestId}/messages`,
    { method: 'POST', body: JSON.stringify({ body }) },
  )
}

export async function resolveRequest(requestId: string, status: 'RESOLVED' | 'REJECTED') {
  return portalFetch<ProjectRequestItem>(`/client-portal/project-requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function navigateToApprovals(requestId?: string) {
  const params = new URLSearchParams(window.location.search)
  params.set('ccView', 'approvals')
  if (requestId) params.set('requestId', requestId)
  const query = params.toString()
  window.location.href = query ? `/?${query}` : '/?ccView=approvals'
}

export async function fetchNotifications(unreadOnly?: boolean) {
  const query = unreadOnly ? '?unreadOnly=true' : ''
  const result = await portalFetch<PortalNotificationItem[]>(
    `/client-portal/notifications${query}`,
  )
  return result.ok ? result.data : []
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const result = await portalFetch<{ count: number }>(
    '/client-portal/notifications/unread-count',
  )
  return result.ok ? result.data.count : 0
}

export async function markNotificationRead(id: string) {
  return portalFetch<PortalNotificationItem>(`/client-portal/notifications/${id}/read`, {
    method: 'PATCH',
  })
}

export async function requestUploadUrl(
  projectId: string,
  file: { fileName: string; mimeType: string; sizeBytes: number },
) {
  return portalFetch<{
    storagePath: string
    signedUrl: string
    token: string
    expiresIn: number
  }>(`/client-portal/projects/${projectId}/attachments/upload-url`, {
    method: 'POST',
    body: JSON.stringify(file),
  })
}

export async function registerAttachment(
  projectId: string,
  payload: {
    storagePath: string
    fileName: string
    mimeType: string
    sizeBytes: number
    requestId?: string
  },
) {
  return portalFetch(`/client-portal/projects/${projectId}/attachments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function uploadProjectFiles(
  projectId: string,
  files: File[],
): Promise<{ ok: boolean; message?: string }> {
  for (const file of files) {
    const urlResult = await requestUploadUrl(projectId, {
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    })
    if (!urlResult.ok) {
      return { ok: false, message: urlResult.message }
    }

    const putResponse = await fetch(urlResult.data.signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    })
    if (!putResponse.ok) {
      return { ok: false, message: `Upload failed for ${file.name}` }
    }

    const reg = await registerAttachment(projectId, {
      storagePath: urlResult.data.storagePath,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    })
    if (!reg.ok) {
      return { ok: false, message: reg.message }
    }
  }
  return { ok: true }
}
