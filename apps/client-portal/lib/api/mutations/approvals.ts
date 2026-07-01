'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import { appendRequestMessageToCache } from '@/lib/projects/append-request-message-cache'
import {
  approveCheckpointMessage,
  markApprovalsRead,
  sendRequestMessage,
} from '@/lib/projects/fetch-projects-client'

export function useMarkApprovalsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (requestId?: string) => markApprovalsRead(requestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.attention.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}

export function useSendRequestMessageMutation(requestId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      body,
      attachmentIds,
    }: {
      body: string
      attachmentIds?: string[]
    }) => sendRequestMessage(requestId, body, attachmentIds),
    onSuccess: (result) => {
      if (!result.ok) return
      appendRequestMessageToCache(queryClient, requestId, result.data)
      void queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all })
    },
  })
}

export function useApproveCheckpointMutation(requestId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (messageId: string) => approveCheckpointMessage(requestId, messageId),
    onSuccess: (result) => {
      if (!result.ok) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.requests.detail(requestId),
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}
