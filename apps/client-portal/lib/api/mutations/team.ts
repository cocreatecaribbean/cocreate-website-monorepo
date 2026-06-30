'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import {
  addProjectMember,
  inviteTeamMember,
  removeProjectMember,
  requestTeamInvite,
  updateTeamMember,
  type ClientOrgRole,
  type ClientProjectAccessLevel,
} from '@/lib/team/fetch-team-client'

export function useInviteTeamMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: {
      email: string
      clientOrgRole: ClientOrgRole
      canAccessSocialListening?: boolean
    }) => inviteTeamMember(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.team.all })
    },
  })
}

export function useRequestTeamInviteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: { email: string; clientOrgRole: ClientOrgRole }) =>
      requestTeamInvite(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.team.all })
    },
  })
}

export function useUpdateTeamMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      body,
    }: {
      userId: string
      body: { clientOrgRole?: ClientOrgRole; canAccessSocialListening?: boolean }
    }) => updateTeamMember(userId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.team.all })
    },
  })
}

export function useAddProjectMemberMutation(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: { email: string; access: ClientProjectAccessLevel }) =>
      addProjectMember(projectId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.team.projectMembers(projectId),
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.team.hub() })
    },
  })
}

export function useRemoveProjectMemberMutation(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => removeProjectMember(projectId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.team.projectMembers(projectId),
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.team.hub() })
    },
  })
}
