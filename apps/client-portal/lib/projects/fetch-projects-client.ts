'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type {
  ClientApprovalRecordItem,
  ClientDashboardStats,
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

export async function fetchDashboardStats(): Promise<ClientDashboardStats | null> {
  const result = await portalFetch<ClientDashboardStats>('/client-portal/dashboard/stats')
  return result.ok ? result.data : null
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

export const APPROVALS_BADGE_REFRESH_EVENT = 'portal-approvals-badge-refresh'
export const PORTAL_NOTIFICATIONS_REFRESH_EVENT = 'portal-notifications-refresh'

export function dispatchPortalNotificationsRefresh() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(APPROVALS_BADGE_REFRESH_EVENT))
  window.dispatchEvent(new Event(PORTAL_NOTIFICATIONS_REFRESH_EVENT))
}

export async function fetchUnreadApprovalsCount(): Promise<number> {
  const result = await portalFetch<{ count: number }>(
    '/client-portal/approvals/unread-count',
  )
  return result.ok ? result.data.count : 0
}

export async function markApprovalsRead(requestId?: string): Promise<void> {
  await portalFetch('/client-portal/approvals/mark-read', {
    method: 'POST',
    body: JSON.stringify(requestId ? { requestId } : {}),
  })
}

export async function fetchApprovalHistory(): Promise<ClientApprovalRecordItem[]> {
  const result = await portalFetch<ClientApprovalRecordItem[]>(
    '/client-portal/approvals/history',
  )
  return result.ok ? result.data : []
}

export async function createCancellationRequest(
  projectId: string,
  reason?: string,
) {
  return portalFetch<ProjectRequestItem>(
    `/client-portal/projects/${projectId}/cancellation-request`,
    { method: 'POST', body: JSON.stringify({ reason }) },
  )
}

export async function approveCheckpointMessage(requestId: string, messageId: string) {
  return portalFetch<ProjectRequestMessage>(
    `/client-portal/project-requests/${requestId}/messages/${messageId}/approve`,
    { method: 'POST', body: JSON.stringify({}) },
  )
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

export function navigateToProject(projectId: string) {
  const params = new URLSearchParams(window.location.search)
  params.set('ccView', 'projects')
  params.set('projectId', projectId)
  window.location.href = `/?${params.toString()}`
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

export async function fetchUnreadAttentionCount(): Promise<number> {
  const result = await portalFetch<{ count: number }>(
    '/client-portal/attention/unread-count',
  )
  return result.ok ? result.data.count : 0
}

export async function fetchAttentionItems(): Promise<PortalNotificationItem[]> {
  const result = await portalFetch<PortalNotificationItem[]>(
    '/client-portal/attention/items',
  )
  return result.ok ? result.data : []
}

export async function markAttentionRead(params: {
  requestId?: string
  projectId?: string
}): Promise<void> {
  await portalFetch('/client-portal/attention/mark-read', {
    method: 'POST',
    body: JSON.stringify(params),
  })
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

export async function fetchAttachmentDownloadUrl(
  attachmentId: string,
): Promise<string | null> {
  const result = await portalFetch<{
    download: { signedUrl: string }
  }>(`/client-portal/attachments/${attachmentId}/download`)
  return result.ok ? result.data.download.signedUrl : null
}

export async function requestProjectCoverUploadUrl(
  projectId: string,
  file: { fileName: string; mimeType: string; sizeBytes: number },
) {
  return portalFetch<{
    storagePath: string
    signedUrl: string
    token: string
    expiresIn: number
  }>(`/client-portal/projects/${projectId}/cover/upload-url`, {
    method: 'POST',
    body: JSON.stringify(file),
  })
}

export async function registerProjectCover(
  projectId: string,
  payload: { storagePath: string },
) {
  return portalFetch<ClientProjectDetail>(`/client-portal/projects/${projectId}/cover`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function removeProjectCover(projectId: string) {
  return portalFetch<ClientProjectDetail>(`/client-portal/projects/${projectId}/cover`, {
    method: 'DELETE',
  })
}

export async function uploadProjectFiles(
  projectId: string,
  files: File[],
  requestId?: string,
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
      requestId,
    })
    if (!reg.ok) {
      return { ok: false, message: reg.message }
    }
  }
  return { ok: true }
}
