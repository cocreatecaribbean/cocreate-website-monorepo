'use client'

import { useMemo, type ReactNode } from 'react'
import { MessagingProvider } from '@cocreate/messaging/messaging-provider'
import { getAdminAccessToken } from '@/lib/api/admin-access-token'
import { adminQueryKeys } from '@/lib/api/query-keys'

const adminMessagingConfig = {
  getAccessToken: getAdminAccessToken,
  threadMessagesQueryKey: (requestId: string) => adminQueryKeys.requests.messages(requestId),
  inboxMessagesQueryKey: (conversationId: string) =>
    adminQueryKeys.orgInbox.messages(conversationId),
  logLabel: 'messaging/admin',
} as const

export function AdminMessagingProvider({ children }: { children: ReactNode }) {
  const config = useMemo(() => adminMessagingConfig, [])
  return <MessagingProvider config={config}>{children}</MessagingProvider>
}
