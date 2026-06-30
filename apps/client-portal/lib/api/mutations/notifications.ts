'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import {
  markAttentionRead,
  markNotificationRead,
} from '@/lib/projects/fetch-projects-client'

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: (result) => {
      if (!result.ok) return
      void queryClient.invalidateQueries({ queryKey: queryKeys.attention.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })
}

export function useMarkAttentionReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { requestId?: string; projectId?: string }) =>
      markAttentionRead(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.attention.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}
