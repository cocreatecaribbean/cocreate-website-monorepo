'use client'

import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import { fetchClientSubscription } from '@client-portal/lib/social-listening/fetch-billing-client'

export function useClientSubscriptionQuery() {
  return useQuery({
    queryKey: queryKeys.socialListening.subscription(),
    queryFn: fetchClientSubscription,
  })
}
