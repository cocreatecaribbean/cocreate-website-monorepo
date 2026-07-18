import type { OrgInboxMessage } from '@/lib/inbox/fetch-org-inbox-admin'

export function isPendingInboxMessage(id: string): boolean {
  return id.startsWith('pending-')
}

function matchesPendingInboxMessage(
  pending: OrgInboxMessage,
  incoming: OrgInboxMessage,
): boolean {
  return (
    pending.authorUserId === incoming.authorUserId &&
    pending.body === incoming.body
  )
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
    attachments: [],
  }
}

export function replacePendingInboxMessage(
  messages: OrgInboxMessage[],
  pendingId: string,
  serverMessage: OrgInboxMessage | null,
): OrgInboxMessage[] {
  const withoutPending = messages.filter((message) => message.id !== pendingId)
  if (!serverMessage) return withoutPending
  if (withoutPending.some((entry) => entry.id === serverMessage.id)) {
    return withoutPending
  }
  return [...withoutPending, serverMessage]
}

export function appendInboxMessageToCache(
  messages: OrgInboxMessage[] | undefined,
  message: OrgInboxMessage,
): OrgInboxMessage[] {
  const current = messages ?? []
  if (current.some((entry) => entry.id === message.id)) return current

  if (!isPendingInboxMessage(message.id)) {
    const pendingIndex = current.findIndex(
      (entry) =>
        isPendingInboxMessage(entry.id) && matchesPendingInboxMessage(entry, message),
    )
    if (pendingIndex >= 0) {
      const next = [...current]
      next[pendingIndex] = message
      return next
    }
  }

  return [...current, message]
}
