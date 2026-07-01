import type { OrgInboxConversation } from '@/lib/inbox/fetch-org-inbox-admin'

export function conversationSubject(conversation: OrgInboxConversation) {
  return (
    conversation.subject ??
    (conversation.visibility === 'ORG_WIDE' ? 'General inquiries' : 'Restricted thread')
  )
}

export function formatConversationDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
