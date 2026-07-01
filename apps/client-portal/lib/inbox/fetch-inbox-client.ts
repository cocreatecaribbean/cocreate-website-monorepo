'use client'
import { nestApiUrl } from '@cocreate/api-client'
import {
  OrgInboxConversationListResponseSchema,
  OrgInboxCreateConversationResponseSchema,
  OrgInboxMessageListResponseSchema,
  OrgInboxRealtimeAuthResponseSchema,
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
  body: string,
): Promise<OrgInboxMessage | null> {
  const data = await inboxFetch<unknown>(
    `/client-portal/inbox/conversations/${conversationId}/messages`,
    { method: 'POST', body: JSON.stringify({ body }) },
  )
  const parsed = parseApiResponseSafe(OrgInboxSendMessageResponseSchema, data)
  return parsed?.message ?? null
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

export async function authorizeOrgInboxRealtime(conversationId: string) {
  const data = await inboxFetch<unknown>(
    `/client-portal/inbox/conversations/${conversationId}/realtime`,
  )
  return parseApiResponseSafe(OrgInboxRealtimeAuthResponseSchema, data)
}
