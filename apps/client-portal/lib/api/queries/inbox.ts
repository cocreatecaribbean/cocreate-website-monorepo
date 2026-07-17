'use client'

import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import { fetchOrgInboxUnreadCount } from '@/lib/inbox/fetch-inbox-client'
import { usePortalPermissions } from '@/lib/team/use-portal-permissions'

export function useOrgInboxUnreadCountQuery() {
  const { canAccessGetHelp, loaded } = usePortalPermissions()

  return useQuery({
    queryKey: queryKeys.inbox.unreadCount(),
    queryFn: fetchOrgInboxUnreadCount,
    staleTime: 30_000,
    enabled: loaded && canAccessGetHelp,
  })
}
