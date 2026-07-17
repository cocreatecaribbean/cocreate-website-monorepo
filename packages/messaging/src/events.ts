export const MESSAGING_NAMESPACE = '/messaging'

export const CLIENT_JOIN_THREAD = 'joinThread'
export const CLIENT_LEAVE_THREAD = 'leaveThread'
export const CLIENT_JOIN_INBOX = 'joinInbox'
export const CLIENT_LEAVE_INBOX = 'leaveInbox'

export const SERVER_THREAD_MESSAGE = 'thread:message'
export const SERVER_THREAD_ATTACHMENT = 'thread:attachment'
export const SERVER_THREAD_STATUS = 'thread:status'
export const SERVER_INBOX_MESSAGE = 'inbox:message'

export type ThreadMessagePayload = {
  requestId: string
  reason: 'message'
  message: Record<string, unknown>
  at: string
}

export type ThreadUpdatePayload = {
  requestId: string
  reason: 'attachment' | 'status'
  at: string
}

export type InboxMessagePayload = {
  conversationId: string
  message: Record<string, unknown>
  at: string
}

export function threadRoom(requestId: string): string {
  return `request:${requestId}`
}

export function inboxRoom(conversationId: string): string {
  return `inbox:${conversationId}`
}
