'use client'

import { useMemo, type ReactNode } from 'react'
import { MessagingProvider } from '@cocreate/messaging/messaging-provider'
import { getPortalAccessToken } from '@/lib/api/portal-access-token'
import { queryKeys } from '@/lib/api/query-keys'

const clientMessagingConfig = {
  getAccessToken: getPortalAccessToken,
  threadMessagesQueryKey: (requestId: string) => queryKeys.requests.messages(requestId),
  inboxMessagesQueryKey: (conversationId: string) => queryKeys.inbox.messages(conversationId),
  logLabel: 'messaging/client',
} as const

export function ClientMessagingProvider({ children }: { children: ReactNode }) {
  const config = useMemo(() => clientMessagingConfig, [])
  return <MessagingProvider config={config}>{children}</MessagingProvider>
}
