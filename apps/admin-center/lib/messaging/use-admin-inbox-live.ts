'use client'

import type { QueryKey } from '@tanstack/react-query'
import { useInboxLive } from '@cocreate/messaging/use-inbox-live'
import { fetchAdminOrgInboxMessages, type OrgInboxMessage } from '@/lib/inbox/fetch-org-inbox-admin'
import { appendInboxMessageToCache } from '@/lib/inbox/optimistic-inbox-message'

export function useAdminInboxLive(
  conversationId: string | undefined,
  options?: {
    enabled?: boolean
    invalidateQueryKeys?: QueryKey[]
  },
) {
  return useInboxLive<OrgInboxMessage>(conversationId, {
    enabled: options?.enabled,
    invalidateQueryKeys: options?.invalidateQueryKeys,
    fetchMessages: fetchAdminOrgInboxMessages,
    appendMessage: appendInboxMessageToCache,
  })
}
