'use client'

import { useQuery } from '@tanstack/react-query'

import { adminQueryKeys } from '@/lib/api/query-keys'
import {
  fetchAdminOrgInboxConversations,
  fetchAdminOrgInboxUnreadCount,
} from '@/lib/inbox/fetch-org-inbox-admin'

export function useAdminOrgInboxConversationsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.orgInbox.conversations(),
    queryFn: fetchAdminOrgInboxConversations,
    staleTime: 30_000,
  })
}

export function useAdminOrgInboxUnreadCountQuery() {
  return useQuery({
    queryKey: adminQueryKeys.orgInbox.unreadCount(),
    queryFn: fetchAdminOrgInboxUnreadCount,
    refetchInterval: 60_000,
  })
}
