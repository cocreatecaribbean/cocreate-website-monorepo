'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import {
  cancelSubscription,
  toggleAutoRenew,
} from '@client-portal/lib/social-listening/fetch-billing-client'

export function useToggleAutoRenewMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (enabled: boolean) => toggleAutoRenew(enabled),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.socialListening.subscription() })
    },
  })
}

export function useCancelSubscriptionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => cancelSubscription(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.socialListening.subscription() })
    },
  })
}
