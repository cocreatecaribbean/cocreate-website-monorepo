'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'

export function useAddProjectCollaboratorMutation(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: { email?: string; userId?: string }) =>
      fetchAdminBff<{ message: string; devSignInUrl?: string }>(`/api/projects/${projectId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.collaborators.project(projectId),
      })
    },
  })
}

export function useRemoveProjectCollaboratorMutation(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) =>
      fetchAdminBff(`/api/projects/${projectId}/collaborators/${userId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.collaborators.project(projectId),
      })
    },
  })
}

export function useInviteCollaboratorMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: { email: string; projectIds?: string[] }) =>
      fetchAdminBff<{ message: string; devSignInUrl?: string }>('/api/collaborators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.collaborators.all })
    },
  })
}

export function useRemoveCollaboratorMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) =>
      fetchAdminBff(`/api/collaborators/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.collaborators.all })
    },
  })
}

export function useResendCollaboratorInviteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) =>
      fetchAdminBff<{ message: string; devSignInUrl?: string }>(
        `/api/collaborators/${userId}/resend-invite`,
        { method: 'POST' },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.collaborators.all })
    },
  })
}

export function useAssignCollaboratorToProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, projectId }: { userId: string; projectId: string }) =>
      fetchAdminBff<{ message: string; devSignInUrl?: string }>(
        `/api/collaborators/${userId}/projects/${projectId}`,
        { method: 'POST' },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.collaborators.all })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.projects.all })
    },
  })
}

export function useUpdateCollaboratorProjectsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      projectIds,
    }: {
      userId: string
      projectIds: string[]
    }) =>
      fetchAdminBff(`/api/collaborators/${userId}/projects`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectIds }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.collaborators.all })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.projects.all })
    },
  })
}
