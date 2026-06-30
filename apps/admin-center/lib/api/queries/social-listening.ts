'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'
import type { SlAdminStats, SlAdminSubscription } from '@/lib/projects/api-types'

export function useSocialListeningStatsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.socialListening.stats(),
    queryFn: () => fetchAdminBff<SlAdminStats>('/api/social-listening/stats'),
  })
}

export function useSocialListeningSubscriptionsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.socialListening.subscriptions(),
    queryFn: () =>
      fetchAdminBff<SlAdminSubscription[]>('/api/social-listening/subscriptions'),
  })
}

export function useSocialListeningSubscriptionQuery(organizationId: string) {
  return useQuery({
    queryKey: adminQueryKeys.socialListening.subscription(organizationId),
    queryFn: () =>
      fetchAdminBff<import('@/lib/projects/api-types').SlSubscriptionDetailResponse>(
        `/api/social-listening/subscriptions/${organizationId}`,
      ),
    enabled: Boolean(organizationId),
  })
}

export function useSocialListeningClientRowsQuery() {
  return useQuery({
    queryKey: [...adminQueryKeys.socialListening.all, 'client-rows'] as const,
    queryFn: () => fetchAdminBff<Array<{ id: string; name: string }>>('/api/clients'),
  })
}
