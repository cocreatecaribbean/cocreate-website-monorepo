'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import {
  addProjectMember,
  inviteTeamMember,
  removeProjectMember,
  removeTeamMember,
  requestTeamInvite,
  transferProjectOwnership,
  updateTeamMember,
  type ClientOrgRole,
} from '@/lib/team/fetch-team-client'

export function useInviteTeamMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: {
      email: string
      clientOrgRole: ClientOrgRole
      canAccessSocialListening?: boolean
      canAccessGetHelp?: boolean
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
      body: {
        clientOrgRole?: ClientOrgRole
        canAccessSocialListening?: boolean
        canAccessGetHelp?: boolean
      }
    }) => updateTeamMember(userId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.team.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.portal() })
    },
  })
}

export function useRemoveTeamMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => removeTeamMember(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.team.all })
    },
  })
}

export function useAddProjectMemberMutation(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: { email: string }) => addProjectMember(projectId, body),
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

export function useTransferProjectOwnershipMutation(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: { newOwnerUserId: string }) =>
      transferProjectOwnership(projectId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.team.projectMembers(projectId),
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.team.hub() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}
