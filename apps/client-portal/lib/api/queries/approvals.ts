'use client'

import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import {
  fetchApprovalHistory,
  fetchOpenApprovals,
  fetchUnreadApprovalsCount,
  type ApprovalsListResult,
} from '@/lib/projects/fetch-projects-client'
import type {
  ClientApprovalRecordItem,
  PendingApprovalFileItem,
} from '@/lib/projects/api-types'

const APPROVALS_STALE_MS = 30 * 1000

export function useOpenApprovalsQuery() {
  return useQuery<ApprovalsListResult<PendingApprovalFileItem>>({
    queryKey: queryKeys.approvals.open(),
    queryFn: fetchOpenApprovals,
    staleTime: APPROVALS_STALE_MS,
  })
}

export function useApprovalHistoryQuery(options?: { enabled?: boolean }) {
  return useQuery<ApprovalsListResult<ClientApprovalRecordItem>>({
    queryKey: queryKeys.approvals.history(),
    queryFn: fetchApprovalHistory,
    staleTime: APPROVALS_STALE_MS,
    enabled: options?.enabled ?? true,
  })
}

export function useUnreadApprovalsCountQuery() {
  return useQuery({
    queryKey: queryKeys.approvals.unreadCount(),
    queryFn: fetchUnreadApprovalsCount,
    staleTime: APPROVALS_STALE_MS,
  })
}
