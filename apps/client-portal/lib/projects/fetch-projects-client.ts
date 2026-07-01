'use client'
import { nestApiUrl } from '@cocreate/api-client'

import { z } from 'zod'
import {
  ClientApprovalRecordItemSchema,
  ClientDashboardStatsSchema,
  ClientFilesLibrarySchema,
  ClientProjectDetailSchema,
  ClientProjectSummarySchema,
  ClientRecentActivityItemSchema,
  PortalNotificationItemSchema,
  ProjectRequestItemSchema,
  ProjectRequestMessageSchema,
} from '@cocreate/api-contracts/v1/client-portal'

import { parseApiResponseSafe } from '@/lib/api/parse-response'
import { getPortalAccessToken } from '@/lib/api/portal-access-token'
import type { ClientRecentActivityItem } from '@/lib/dashboard/types'
import type {
  ClientApprovalRecordItem,
  ClientDashboardStats,
  ClientProjectDetail,
  ClientProjectSummary,
  PortalNotificationItem,
  ClientFilesLibrary,
  FilesQuery,
  ProjectAttachment,
  ProjectRequestItem,
  ProjectRequestMessage,
} from '@/lib/projects/api-types'


async function portalFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const token = await getPortalAccessToken()
  if (!token) {
    return { ok: false, status: 401, message: 'Not signed in' }
  }

  let response: Response
  try {
    response = await fetch(nestApiUrl(path), {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
      cache: 'no-store',
    })
  } catch {
    return {
      ok: false,
      status: 0,
      message:
        'Could not reach the API. Ensure apps/api is running on port 3001.',
    }
  }

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
  const result = await portalFetch<unknown>('/client-portal/projects')
  if (!result.ok) return []
  const parsed = parseApiResponseSafe(z.array(ClientProjectSummarySchema), result.data)
  return parsed ?? []
}

export async function fetchDashboardStats(): Promise<ClientDashboardStats | null> {
  const result = await portalFetch<unknown>('/client-portal/dashboard/stats')
  if (!result.ok) return null
  return parseApiResponseSafe(ClientDashboardStatsSchema, result.data)
}

export async function fetchClientRecentActivity(
  limit = 15,
): Promise<ClientRecentActivityItem[]> {
  const result = await portalFetch<unknown>(
    `/client-portal/dashboard/recent-activity?limit=${encodeURIComponent(String(limit))}`,
  )
  if (!result.ok) return []
  const parsed = parseApiResponseSafe(
    z.array(ClientRecentActivityItemSchema),
    result.data,
  )
  return parsed ?? []
}

export async function fetchProject(
  id: string,
  view: 'overview' | 'full' = 'overview',
): Promise<ClientProjectDetail | null> {
  const result = await portalFetch<unknown>(
    `/client-portal/projects/${id}?view=${encodeURIComponent(view)}`,
  )
  if (!result.ok) return null
  return parseApiResponseSafe(ClientProjectDetailSchema, result.data)
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
  const result = await portalFetch<unknown>('/client-portal/projects/requests/open')
  if (!result.ok) return []
  const parsed = parseApiResponseSafe(z.array(ProjectRequestItemSchema), result.data)
  if (parsed) return parsed
  if (process.env.NODE_ENV === 'development') {
    console.warn('[fetchOpenApprovals] Response parse failed; using raw array fallback')
  }
  return Array.isArray(result.data) ? (result.data as ProjectRequestItem[]) : []
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
  const result = await portalFetch<unknown>(
    '/client-portal/approvals/history',
  )
  if (!result.ok) return []
  const parsed = parseApiResponseSafe(
    z.array(ClientApprovalRecordItemSchema),
    result.data,
  )
  return parsed ?? []
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

export async function authorizeRequestThreadRealtime(requestId: string) {
  return portalFetch<{ enabled: boolean; channel: string }>(
    `/client-portal/project-requests/${requestId}/realtime`,
  )
}

export async function sendRequestMessage(
  requestId: string,
  body: string,
  attachmentIds?: string[],
) {
  return portalFetch<ProjectRequestMessage>(
    `/client-portal/project-requests/${requestId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({
        body,
        attachmentIds: attachmentIds?.length ? attachmentIds : undefined,
      }),
    },
  )
}

function buildFilesQuery(query?: FilesQuery): string {
  const params = new URLSearchParams()
  if (query?.projectId) params.set('projectId', query.projectId)
  if (query?.q) params.set('q', query.q)
  if (query?.cursor) params.set('cursor', query.cursor)
  if (query?.limit != null) params.set('limit', String(query.limit))
  const text = params.toString()
  return text ? `?${text}` : ''
}

export async function fetchFilesLibrary(query?: FilesQuery): Promise<ClientFilesLibrary> {
  const result = await portalFetch<unknown>(
    `/client-portal/files/library${buildFilesQuery(query)}`,
  )
  if (!result.ok) return { projects: [], files: [], nextCursor: null }
  return (
    parseApiResponseSafe(ClientFilesLibrarySchema, result.data) ?? {
      projects: [],
      files: [],
      nextCursor: null,
    }
  )
}

export async function fetchProjectFiles(
  projectId: string,
  query?: Omit<FilesQuery, 'projectId'>,
): Promise<ClientFilesLibrary | null> {
  const result = await portalFetch<unknown>(
    `/client-portal/projects/${projectId}/files${buildFilesQuery(query)}`,
  )
  if (!result.ok) return null
  return parseApiResponseSafe(ClientFilesLibrarySchema, result.data)
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
  const result = await portalFetch<unknown>(`/client-portal/notifications${query}`)
  if (!result.ok) return []
  const parsed = parseApiResponseSafe(z.array(PortalNotificationItemSchema), result.data)
  return parsed ?? []
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
  const result = await portalFetch<unknown>('/client-portal/attention/items')
  if (!result.ok) return []
  const parsed = parseApiResponseSafe(z.array(PortalNotificationItemSchema), result.data)
  return parsed ?? []
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
  return portalFetch<ProjectAttachment>(`/client-portal/projects/${projectId}/attachments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchAttachmentDownloadUrl(
  attachmentId: string,
): Promise<string | null> {
  try {
    const response = await fetch(`/api/attachments/${attachmentId}/download`, {
      cache: 'no-store',
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) return null
    if (
      typeof data === 'object' &&
      data &&
      'download' in data &&
      typeof (data as { download: { signedUrl?: string } }).download?.signedUrl === 'string'
    ) {
      return (data as { download: { signedUrl: string } }).download.signedUrl
    }
    return null
  } catch {
    return null
  }
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
): Promise<{ ok: boolean; message?: string; attachmentIds?: string[] }> {
  const attachmentIds: string[] = []
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
    attachmentIds.push(reg.data.id)
  }
  return { ok: true, attachmentIds }
}
