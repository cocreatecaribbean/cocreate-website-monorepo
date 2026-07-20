'use client'

import { z } from 'zod'
import {
  ClientDashboardStatsSchema,
  ClientFilesLibrarySchema,
  ClientProjectDetailSchema,
  ClientProjectSummarySchema,
  ClientRecentActivityItemSchema,
  PortalNotificationItemSchema,
  FileReactionsResponseSchema,
  ProjectAttachmentWithReactionsSchema,
  ProjectRequestItemSchema,
  ProjectRequestMessageSchema,
  TopPicksResponseSchema,
} from '@cocreate/api-contracts/v1/client-portal'

import { parseApiResponseSafe } from '@/lib/api/parse-response'
import {
  PROJECT_ID_QUERY,
  PROJECT_TAB_QUERY,
  type PortalProjectTabId,
} from '@/lib/control-center/project-workspace'
import type { ClientRecentActivityItem } from '@/lib/dashboard/types'
import type {
  ClientDashboardStats,
  ClientProjectDetail,
  ClientProjectSummary,
  PortalNotificationItem,
  FileReactionsResponse,
  ProjectAttachmentWithReactions,
  ProjectFileReactionKind,
  ClientFilesLibrary,
  FilesQuery,
  ProjectAttachment,
  ProjectRequestItem,
  ProjectRequestMessage,
  TopPicksResponse,
} from '@/lib/projects/api-types'

function portalProxyUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (!normalized.startsWith('/client-portal')) {
    throw new Error(`portalFetch path must start with /client-portal: ${path}`)
  }
  return `/api${normalized}`
}

async function portalFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  let response: Response
  try {
    response = await fetch(portalProxyUrl(path), {
      ...init,
      headers: {
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

export async function fetchProjects(options?: {
  cursor?: string
  limit?: number
}): Promise<{ projects: ClientProjectSummary[]; nextCursor: string | null }> {
  const params = new URLSearchParams()
  if (options?.cursor) params.set('cursor', options.cursor)
  if (options?.limit) params.set('limit', String(options.limit))
  const query = params.toString()
  const result = await portalFetch<unknown>(
    `/client-portal/projects${query ? `?${query}` : ''}`,
  )
  if (!result.ok) return { projects: [], nextCursor: null }
  const paginatedSchema = z.object({
    projects: z.array(ClientProjectSummarySchema),
    nextCursor: z.string().nullable(),
  })
  const parsedPaginated = parseApiResponseSafe(paginatedSchema, result.data)
  if (parsedPaginated) return parsedPaginated
  const parsedArray = parseApiResponseSafe(z.array(ClientProjectSummarySchema), result.data)
  return { projects: parsedArray ?? [], nextCursor: null }
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

export async function renameProject(
  projectId: string,
  title: string,
): Promise<{ ok: boolean; project?: ClientProjectDetail; message?: string }> {
  const result = await portalFetch<ClientProjectDetail>(
    `/client-portal/projects/${encodeURIComponent(projectId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    },
  )
  if (!result.ok) return { ok: false, message: result.message }
  return { ok: true, project: result.data }
}

export async function fetchProjectTopPicks(
  projectId: string,
  tags?: string[],
): Promise<TopPicksResponse> {
  const params = new URLSearchParams()
  if (tags?.length) params.set('tags', tags.join(','))
  const query = params.toString()
  const result = await portalFetch<unknown>(
    `/client-portal/projects/${encodeURIComponent(projectId)}/top-picks${query ? `?${query}` : ''}`,
  )
  if (!result.ok) {
    throw new Error(result.message)
  }
  return (
    parseApiResponseSafe(TopPicksResponseSchema, result.data) ?? {
      items: [],
      availableTags: [],
    }
  )
}

export async function fetchProjectFileReactions(
  projectId: string,
): Promise<FileReactionsResponse> {
  const result = await portalFetch<unknown>(
    `/client-portal/projects/${encodeURIComponent(projectId)}/file-reactions`,
  )
  if (!result.ok) {
    throw new Error(result.message)
  }
  return (
    parseApiResponseSafe(FileReactionsResponseSchema, result.data) ?? {
      items: [],
    }
  )
}

export async function setFileReaction(
  attachmentId: string,
  kind: ProjectFileReactionKind,
): Promise<ProjectAttachmentWithReactions | null> {
  const result = await portalFetch<unknown>(
    `/client-portal/attachments/${encodeURIComponent(attachmentId)}/reaction`,
    { method: 'PUT', body: JSON.stringify({ kind }) },
  )
  if (!result.ok) return null
  return parseApiResponseSafe(ProjectAttachmentWithReactionsSchema, result.data)
}

export async function clearFileReaction(
  attachmentId: string,
): Promise<ProjectAttachmentWithReactions | null> {
  const result = await portalFetch<unknown>(
    `/client-portal/attachments/${encodeURIComponent(attachmentId)}/reaction`,
    { method: 'DELETE' },
  )
  if (!result.ok) return null
  return parseApiResponseSafe(ProjectAttachmentWithReactionsSchema, result.data)
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
  const result = await portalFetch<unknown>(
    `/client-portal/project-requests/${requestId}`,
  )
  if (!result.ok) return result
  const parsed = parseApiResponseSafe(ProjectRequestItemSchema, result.data)
  if (parsed) return { ok: true as const, data: parsed }
  if (process.env.NODE_ENV === 'development') {
    console.warn('[fetchRequestThread] Response parse failed; using raw fallback')
  }
  return { ok: true as const, data: result.data as ProjectRequestItem }
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

export function navigateToProject(projectId: string, tab?: PortalProjectTabId) {
  const params = new URLSearchParams(window.location.search)
  params.set('ccView', 'projects')
  params.set(PROJECT_ID_QUERY, projectId)
  if (tab && tab !== 'overview') {
    params.set(PROJECT_TAB_QUERY, tab)
  }
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

export type AttachmentDownloadUrlResult = {
  url: string | null
  error?: string
}

function attachmentDownloadErrorMessage(
  status: number,
  data: unknown,
): string {
  if (typeof data === 'object' && data && 'message' in data) {
    const message = String((data as { message: unknown }).message)
    if (message) return message
  }
  if (status === 404) return 'File not found'
  if (status === 403) return 'You do not have access to this file'
  if (status === 0) return 'Could not reach the download service'
  return `Could not load file (${status})`
}

const DOWNLOAD_URL_CACHE_TTL_MS = 50 * 60 * 1000
const downloadUrlCache = new Map<string, { url: string; expiresAt: number }>()

export async function fetchAttachmentDownloadUrl(
  attachmentId: string,
): Promise<AttachmentDownloadUrlResult> {
  const cached = downloadUrlCache.get(attachmentId)
  if (cached && cached.expiresAt > Date.now()) {
    return { url: cached.url }
  }

  try {
    const response = await fetch(`/api/attachments/${attachmentId}/download`, {
      cache: 'no-store',
      credentials: 'include',
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      return {
        url: null,
        error: attachmentDownloadErrorMessage(response.status, data),
      }
    }
    if (
      typeof data === 'object' &&
      data &&
      'download' in data &&
      typeof (data as { download: { signedUrl?: string } }).download?.signedUrl === 'string'
    ) {
      const url = (data as { download: { signedUrl: string } }).download.signedUrl
      downloadUrlCache.set(attachmentId, {
        url,
        expiresAt: Date.now() + DOWNLOAD_URL_CACHE_TTL_MS,
      })
      return { url }
    }
    return { url: null, error: 'Could not sign download URL' }
  } catch {
    return { url: null, error: 'Could not reach the download service' }
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
