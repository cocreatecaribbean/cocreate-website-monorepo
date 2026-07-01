'use client'

import {
  OrgInboxConversationListResponseSchema,
  OrgInboxMessageListResponseSchema,
  OrgInboxRealtimeAuthResponseSchema,
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
  body: string,
): Promise<void> {
  await fetchAdminBff(`/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  })
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
