'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'

export function useApproveTeamInviteMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (requestId: string) =>
      fetchAdminBff(
        `/api/clients/${organizationId}/team/invite-requests/${requestId}/approve`,
        { method: 'POST' },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.team.members(organizationId),
      })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.inbox.all })
    },
  })
}

export function useRejectTeamInviteMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      requestId,
      rejectionReason,
    }: {
      requestId: string
      rejectionReason?: string
    }) =>
      fetchAdminBff(
        `/api/clients/${organizationId}/team/invite-requests/${requestId}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rejectionReason }),
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.team.members(organizationId),
      })
    },
  })
}

export function useUpdateClientTeamMemberMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      body,
    }: {
      userId: string
      body: Record<string, unknown>
    }) =>
      fetchAdminBff(`/api/clients/${organizationId}/team/${userId}`, {
        method: 'PATCH',
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

export function useSuspendClientTeamMemberMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) =>
      fetchAdminBff(`/api/clients/${organizationId}/team/${userId}/suspend`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.team.members(organizationId),
      })
    },
  })
}
