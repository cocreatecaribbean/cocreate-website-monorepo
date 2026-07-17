'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'

export function useSuspendClientUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) =>
      fetchAdminBff(`/api/clients/users/${userId}/suspend`, { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.clients.all })
    },
  })
}

export function useRemoveClientTeamMemberMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) =>
      fetchAdminBff(`/api/clients/${organizationId}/team/${userId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.team.members(organizationId),
      })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.clients.all })
    },
  })
}

export function useInviteClientTeamMemberMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: {
      email: string
      clientOrgRole: string
      canAccessSocialListening?: boolean
    }) =>
      fetchAdminBff(`/api/clients/${organizationId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.team.members(organizationId),
      })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.clients.all })
    },
  })
}
