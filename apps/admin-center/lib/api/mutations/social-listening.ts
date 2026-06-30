'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'

export function useGrantSocialListeningSubscriptionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetchAdminBff('/api/social-listening/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.socialListening.all })
    },
  })
}

export function useCreateSocialListeningSetupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetchAdminBff('/api/social-listening/setups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.socialListening.all })
    },
  })
}

export function useCancelSocialListeningSubscriptionMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ immediate, cancelReason }: { immediate: boolean; cancelReason: string }) =>
      fetchAdminBff(`/api/social-listening/subscriptions/${organizationId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediate, cancelReason }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.socialListening.subscription(organizationId),
      })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.socialListening.subscriptions() })
    },
  })
}

export function useExtendSocialListeningSubscriptionMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (extendMonths: number) =>
      fetchAdminBff(`/api/social-listening/subscriptions/${organizationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extendMonths }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.socialListening.subscription(organizationId),
      })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.socialListening.subscriptions() })
    },
  })
}
