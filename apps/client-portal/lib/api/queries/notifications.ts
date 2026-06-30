'use client'

import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import {
  fetchAttentionItems,
  fetchUnreadAttentionCount,
} from '@/lib/projects/fetch-projects-client'

export function useAttentionItemsQuery() {
  return useQuery({
    queryKey: queryKeys.attention.items(),
    queryFn: fetchAttentionItems,
  })
}

export function useUnreadAttentionCountQuery() {
  return useQuery({
    queryKey: queryKeys.attention.unreadCount(),
    queryFn: fetchUnreadAttentionCount,
    staleTime: 30 * 1000,
  })
}
