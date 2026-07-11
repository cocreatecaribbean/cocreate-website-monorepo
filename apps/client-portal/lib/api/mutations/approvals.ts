'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  appendApprovalCommentToList,
  createOptimisticApprovalComment,
  replacePendingApprovalComment,
  type ApprovalCommentLike,
} from '@cocreate/app-ui/approval-comment-cache'

import { usePortalProfileQuery } from '@/lib/api/queries/team'
import { queryKeys } from '@/lib/api/query-keys'
import {
  approveApprovalItem,
  fetchApprovalComments,
  markApprovalsRead,
  requestApprovalNeedsChanges,
  sendApprovalComment,
  type ApprovalsListResult,
} from '@/lib/projects/fetch-projects-client'
import type { PendingApprovalFileItem } from '@/lib/projects/api-types'

export function useMarkApprovalsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (requestId?: string) => markApprovalsRead(requestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.approvals.unreadCount() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.attention.unreadCount() })
    },
  })
}

export function useApprovalCommentsQuery(approvalItemId: string | null) {
  return useQuery({
    queryKey: queryKeys.approvals.comments(approvalItemId ?? ''),
    queryFn: async () => {
      const result = await fetchApprovalComments(approvalItemId!)
      if (!result.ok) throw new Error(result.message)
      return result.data.comments as ApprovalCommentLike[]
    },
    enabled: Boolean(approvalItemId),
  })
}

export function useApproveApprovalItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (approvalItemId: string) => approveApprovalItem(approvalItemId),
    onSuccess: (result) => {
      if (!result.ok) return
      void queryClient.invalidateQueries({ queryKey: queryKeys.approvals.open() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.approvals.history() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
    },
  })
}

function patchOpenApprovalStatus(
  result: ApprovalsListResult<PendingApprovalFileItem> | undefined,
  approvalItemId: string,
): ApprovalsListResult<PendingApprovalFileItem> | undefined {
  if (!result?.items?.length) return result
  return {
    ...result,
    items: result.items.map((file) => {
      const id = file.approvalItemId ?? file.id
      if (id !== approvalItemId) return file
      return { ...file, status: 'NEEDS_CHANGES' as const }
    }),
  }
}

export function useRequestApprovalNeedsChangesMutation() {
  const queryClient = useQueryClient()
  const { data: profile } = usePortalProfileQuery()

  return useMutation({
    mutationFn: ({
      approvalItemId,
      body,
    }: {
      approvalItemId: string
      body?: string
    }) => requestApprovalNeedsChanges(approvalItemId, body),
    onMutate: async ({ approvalItemId, body }) => {
      const commentsKey = queryKeys.approvals.comments(approvalItemId)
      const openKey = queryKeys.approvals.open()
      await queryClient.cancelQueries({ queryKey: commentsKey })
      await queryClient.cancelQueries({ queryKey: openKey })

      const previousComments = queryClient.getQueryData<ApprovalCommentLike[]>(commentsKey)
      const previousOpen =
        queryClient.getQueryData<ApprovalsListResult<PendingApprovalFileItem>>(openKey)

      const authorDisplayName = profile?.user?.email ?? 'You'
      const commentBody = body?.trim() || 'Needs changes'
      const optimistic = createOptimisticApprovalComment({
        approvalItemId,
        body: commentBody,
        authorRole: 'CLIENT',
        authorDisplayName,
        authorUserId: profile?.user?.id,
      })

      queryClient.setQueryData(
        commentsKey,
        appendApprovalCommentToList(previousComments, optimistic),
      )
      queryClient.setQueryData(openKey, (current) =>
        patchOpenApprovalStatus(
          current as ApprovalsListResult<PendingApprovalFileItem> | undefined,
          approvalItemId,
        ),
      )

      return { previousComments, previousOpen, optimisticId: optimistic.id }
    },
    onSuccess: (result, variables) => {
      if (!result.ok) return
      const openKey = queryKeys.approvals.open()
      queryClient.setQueryData(openKey, (current) =>
        patchOpenApprovalStatus(
          current as ApprovalsListResult<PendingApprovalFileItem> | undefined,
          variables.approvalItemId,
        ),
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
    },
    onError: (_error, variables, context) => {
      if (!context) return
      queryClient.setQueryData(
        queryKeys.approvals.comments(variables.approvalItemId),
        context.previousComments,
      )
      queryClient.setQueryData(queryKeys.approvals.open(), context.previousOpen)
    },
  })
}

export function useSendApprovalCommentMutation(approvalItemId: string) {
  const queryClient = useQueryClient()
  const { data: profile } = usePortalProfileQuery()
  const commentsKey = queryKeys.approvals.comments(approvalItemId)

  return useMutation({
    mutationFn: (body: string) => sendApprovalComment(approvalItemId, body),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: commentsKey })
      const previous = queryClient.getQueryData<ApprovalCommentLike[]>(commentsKey)
      const authorDisplayName = profile?.user?.email ?? 'You'
      const optimistic = createOptimisticApprovalComment({
        approvalItemId,
        body: body.trim(),
        authorRole: 'CLIENT',
        authorDisplayName,
        authorUserId: profile?.user?.id,
      })
      queryClient.setQueryData(
        commentsKey,
        appendApprovalCommentToList(previous, optimistic),
      )
      return { previous, optimisticId: optimistic.id }
    },
    onSuccess: (result, _body, context) => {
      if (!result.ok || !context) return
      const serverComment = result.data.comment as ApprovalCommentLike
      queryClient.setQueryData(commentsKey, (current: ApprovalCommentLike[] | undefined) =>
        replacePendingApprovalComment(current, context.optimisticId, serverComment),
      )
    },
    onError: (_error, _body, context) => {
      if (!context) return
      queryClient.setQueryData(commentsKey, context.previous)
    },
  })
}
