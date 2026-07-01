'use client'

import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import { fetchOrgInboxUnreadCount } from '@/lib/inbox/fetch-inbox-client'

export function useOrgInboxUnreadCountQuery() {
  return useQuery({
    queryKey: queryKeys.inbox.unreadCount(),
    queryFn: fetchOrgInboxUnreadCount,
    staleTime: 30_000,
  })
}
