'use client'

import {
  OrgInboxConversationListResponseSchema,
  OrgInboxMessageListResponseSchema,
  OrgInboxRealtimeAuthResponseSchema,
  OrgInboxSendMessageResponseSchema,
  OrgInboxUnreadCountResponseSchema,
  type OrgInboxConversation,
  type OrgInboxMessage,
} from '@cocreate/api-contracts/v1/admin-portal'

import { parseApiResponseSafe } from '@/lib/api/parse-response'
import { fetchAdminBff } from '@/lib/admin-api-fetch'

export type { OrgInboxConversation, OrgInboxMessage }

export async function fetchAdminOrgInboxConversations(): Promise<OrgInboxConversation[]> {
  const data = await fetchAdminBff<unknown>('/api/messages/conversations')
  const parsed = parseApiResponseSafe(OrgInboxConversationListResponseSchema, data)
  return parsed?.conversations ?? []
}

export async function fetchAdminOrgInboxConversationsForClient(
  organizationId: string,
): Promise<OrgInboxConversation[]> {
  const data = await fetchAdminBff<unknown>(
    `/api/clients/${organizationId}/org-inbox/conversations`,
  )
  const parsed = parseApiResponseSafe(OrgInboxConversationListResponseSchema, data)
  return parsed?.conversations ?? []
}

export async function fetchAdminOrgInboxUnreadCount(): Promise<number> {
  const data = await fetchAdminBff<unknown>('/api/messages/unread-count')
  const parsed = parseApiResponseSafe(OrgInboxUnreadCountResponseSchema, data)
  return parsed?.unreadCount ?? 0
}

export async function fetchAdminOrgInboxMessages(
  conversationId: string,
): Promise<OrgInboxMessage[]> {
  const data = await fetchAdminBff<unknown>(
    `/api/messages/conversations/${conversationId}/messages`,
  )
  const parsed = parseApiResponseSafe(OrgInboxMessageListResponseSchema, data)
  return parsed?.messages ?? []
}

export async function sendAdminOrgInboxMessage(
  conversationId: string,
  payload: { body: string; attachmentIds?: string[] },
): Promise<OrgInboxMessage | null> {
  const data = await fetchAdminBff<unknown>(
    `/api/messages/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
  const parsed = parseApiResponseSafe(OrgInboxSendMessageResponseSchema, data)
  return parsed?.message ?? null
}

async function requestOrgInboxUploadUrl(
  conversationId: string,
  file: { fileName: string; mimeType: string; sizeBytes: number },
) {
  return fetchAdminBff<{
    storagePath: string
    signedUrl: string
    token: string
    expiresIn: number
  }>(`/api/messages/conversations/${conversationId}/attachments/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  return fetchAdminBff<{ id: string }>(
    `/api/messages/conversations/${conversationId}/attachments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const data = await fetchAdminBff<{
      download?: { signedUrl?: string }
    }>(`/api/messages/attachments/${attachmentId}/download`)
    return data.download?.signedUrl ?? null
  } catch {
    return null
  }
}

export async function markAdminOrgInboxRead(conversationId: string): Promise<void> {
  await fetchAdminBff(`/api/messages/conversations/${conversationId}/mark-read`, {
    method: 'POST',
  })
}

export async function authorizeAdminOrgInboxRealtime(conversationId: string) {
  const data = await fetchAdminBff<unknown>(
    `/api/messages/conversations/${conversationId}/realtime`,
  )
  return parseApiResponseSafe(OrgInboxRealtimeAuthResponseSchema, data)
}
