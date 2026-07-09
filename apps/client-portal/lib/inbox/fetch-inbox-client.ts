'use client'
import { nestApiUrl } from '@cocreate/api-client'
import {
  OrgInboxConversationListResponseSchema,
  OrgInboxCreateConversationResponseSchema,
  OrgInboxMessageListResponseSchema,
  OrgInboxSendMessageResponseSchema,
  OrgInboxUnreadCountResponseSchema,
  type OrgInboxConversation,
  type OrgInboxMessage,
} from '@cocreate/api-contracts/v1/shared/org-inbox'
import type { CreateOrgInboxConversationInput } from '@cocreate/api-contracts/v1/requests/org-inbox'

import { parseApiResponseSafe } from '@/lib/api/parse-response'
import { getPortalAccessToken } from '@/lib/api/portal-access-token'

export type { OrgInboxConversation, OrgInboxMessage }

async function getToken() {
  return getPortalAccessToken()
}

async function inboxFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken()
  if (!token) throw new Error('Not signed in')

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
    throw new Error(
      'Could not reach the API. Ensure apps/api is running on port 3001.',
    )
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(
      typeof data === 'object' && data && 'message' in data
        ? String((data as { message: string }).message)
        : `Request failed (${response.status})`,
    )
  }
  return data as T
}

export async function fetchOrgInboxConversations(): Promise<OrgInboxConversation[]> {
  const data = await inboxFetch<unknown>('/client-portal/inbox/conversations')
  const parsed = parseApiResponseSafe(OrgInboxConversationListResponseSchema, data)
  return parsed?.conversations ?? []
}

export async function fetchOrgInboxUnreadCount(): Promise<number> {
  const data = await inboxFetch<unknown>('/client-portal/inbox/unread-count')
  const parsed = parseApiResponseSafe(OrgInboxUnreadCountResponseSchema, data)
  return parsed?.unreadCount ?? 0
}

export async function fetchOrgInboxMessages(conversationId: string): Promise<OrgInboxMessage[]> {
  const data = await inboxFetch<unknown>(
    `/client-portal/inbox/conversations/${conversationId}/messages`,
  )
  const parsed = parseApiResponseSafe(OrgInboxMessageListResponseSchema, data)
  return parsed?.messages ?? []
}

export async function sendOrgInboxMessage(
  conversationId: string,
  payload: { body: string; attachmentIds?: string[] },
): Promise<OrgInboxMessage | null> {
  const data = await inboxFetch<unknown>(
    `/client-portal/inbox/conversations/${conversationId}/messages`,
    { method: 'POST', body: JSON.stringify(payload) },
  )
  const parsed = parseApiResponseSafe(OrgInboxSendMessageResponseSchema, data)
  return parsed?.message ?? null
}

async function requestOrgInboxUploadUrl(
  conversationId: string,
  file: { fileName: string; mimeType: string; sizeBytes: number },
) {
  return inboxFetch<{
    storagePath: string
    signedUrl: string
    token: string
    expiresIn: number
  }>(`/client-portal/inbox/conversations/${conversationId}/attachments/upload-url`, {
    method: 'POST',
    body: JSON.stringify(file),
  })
}

async function registerOrgInboxAttachment(
  conversationId: string,
  payload: {
    storagePath: string
    fileName: string
    mimeType: string
    sizeBytes: number
  },
) {
  return inboxFetch<{ id: string }>(
    `/client-portal/inbox/conversations/${conversationId}/attachments`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export async function uploadOrgInboxFiles(
  conversationId: string,
  files: File[],
): Promise<{ ok: boolean; message?: string; attachmentIds?: string[] }> {
  if (!files.length) return { ok: true, attachmentIds: [] }
  const attachmentIds: string[] = []
  try {
    for (const file of files) {
      const urlResult = await requestOrgInboxUploadUrl(conversationId, {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      })
      const putResponse = await fetch(urlResult.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })
      if (!putResponse.ok) {
        return { ok: false, message: `Upload failed for ${file.name}` }
      }
      const registered = await registerOrgInboxAttachment(conversationId, {
        storagePath: urlResult.storagePath,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      })
      attachmentIds.push(registered.id)
    }
    return { ok: true, attachmentIds }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'File upload failed',
    }
  }
}

export async function fetchOrgInboxAttachmentDownloadUrl(
  attachmentId: string,
): Promise<string | null> {
  try {
    const data = await inboxFetch<{ download?: { signedUrl?: string } }>(
      `/client-portal/inbox/attachments/${attachmentId}/download`,
    )
    return data.download?.signedUrl ?? null
  } catch {
    return null
  }
}

export async function createOrgInboxConversation(
  payload: CreateOrgInboxConversationInput,
): Promise<OrgInboxConversation | null> {
  const data = await inboxFetch<unknown>('/client-portal/inbox/conversations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  const parsed = parseApiResponseSafe(OrgInboxCreateConversationResponseSchema, data)
  return parsed?.conversation ?? null
}

export async function markOrgInboxRead(conversationId: string) {
  await inboxFetch(`/client-portal/inbox/conversations/${conversationId}/mark-read`, {
    method: 'POST',
  })
}
