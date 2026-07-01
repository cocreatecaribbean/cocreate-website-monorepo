import type { OrgInboxMessage } from '@/lib/inbox/fetch-org-inbox-admin'

export function isPendingInboxMessage(id: string): boolean {
  return id.startsWith('pending-')
}

export function createOptimisticInboxMessage(
  conversationId: string,
  body: string,
  author: { userId: string; email: string; role: 'CLIENT' | 'ADMIN' },
): OrgInboxMessage {
  return {
    id: `pending-${crypto.randomUUID()}`,
    conversationId,
    authorUserId: author.userId,
    authorEmail: author.email,
    authorRole: author.role,
    body,
    createdAt: new Date().toISOString(),
  }
}

export function replacePendingInboxMessage(
  messages: OrgInboxMessage[],
  pendingId: string,
  serverMessage: OrgInboxMessage | null,
): OrgInboxMessage[] {
  const withoutPending = messages.filter((message) => message.id !== pendingId)
  if (serverMessage) return [...withoutPending, serverMessage]
  return withoutPending
}

export function appendInboxMessageToCache(
  messages: OrgInboxMessage[] | undefined,
  message: OrgInboxMessage,
): OrgInboxMessage[] {
  const current = messages ?? []
  if (current.some((entry) => entry.id === message.id)) return current
  return [...current, message]
}
