'use client'

import type { QueryKey } from '@tanstack/react-query'
import { useInboxLive } from '@cocreate/messaging/use-inbox-live'
import { fetchOrgInboxMessages, type OrgInboxMessage } from '@/lib/inbox/fetch-inbox-client'
import { appendInboxMessageToCache } from '@/lib/inbox/optimistic-inbox-message'

export function useClientInboxLive(
  conversationId: string | undefined,
  options?: {
    enabled?: boolean
    invalidateQueryKeys?: QueryKey[]
  },
) {
  return useInboxLive<OrgInboxMessage>(conversationId, {
    enabled: options?.enabled,
    invalidateQueryKeys: options?.invalidateQueryKeys,
    fetchMessages: fetchOrgInboxMessages,
    appendMessage: appendInboxMessageToCache,
  })
}
