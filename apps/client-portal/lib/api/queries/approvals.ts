'use client'

import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import {
  fetchApprovalHistory,
  fetchOpenApprovals,
  fetchUnreadApprovalsCount,
} from '@/lib/projects/fetch-projects-client'

export function useOpenApprovalsQuery() {
  return useQuery({
    queryKey: queryKeys.approvals.open(),
    queryFn: fetchOpenApprovals,
  })
}

export function useApprovalHistoryQuery() {
  return useQuery({
    queryKey: queryKeys.approvals.history(),
    queryFn: fetchApprovalHistory,
  })
}

export function useUnreadApprovalsCountQuery() {
  return useQuery({
    queryKey: queryKeys.approvals.unreadCount(),
    queryFn: fetchUnreadApprovalsCount,
    staleTime: 30 * 1000,
  })
}
