import type { OrgInboxMessage } from '@/lib/inbox/fetch-org-inbox-admin'

export const ORG_INBOX_REALTIME_EVENT = 'inbox:update'

export type OrgInboxRealtimePayload = {
  conversationId: string
  messageId?: string
  message?: OrgInboxMessage
  at: string
}

export function isOrgInboxRealtimeEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}
