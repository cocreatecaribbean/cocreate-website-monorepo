'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'
import { appendRequestMessageToCache } from '@/lib/projects/append-request-message-cache'
import type { ProjectRequestMessage } from '@/lib/projects/types'
import {
  createProjectForAdmin,
  type CreateProjectForAdminPayload,
} from '@/lib/projects/fetch-admin-projects'
import type { ClientProjectSummary, ProjectRequestItem } from '@/lib/projects/types'

export function useCreateProjectForAdminMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProjectForAdminPayload) =>
      createProjectForAdmin(organizationId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.projects.all })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.projects.byOrganization(organizationId),
      })
    },
  })
}

export function useUpdateAdminProjectMutation(projectId: string, organizationId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetchAdminBff(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.projects.detail(projectId) })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.projects.all })
      if (organizationId) {
        void queryClient.invalidateQueries({
          queryKey: adminQueryKeys.projects.byOrganization(organizationId),
        })
      }
    },
  })
}

export function useSendAdminRequestMessageMutation(requestId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: { body: string; attachmentIds?: string[] }) =>
      fetchAdminBff<ProjectRequestMessage>(`/api/project-requests/${requestId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: (message) => {
      appendRequestMessageToCache(queryClient, requestId, message)
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.projects.all })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.inbox.all })
    },
  })
}

export function useResolveAdminRequestMutation(requestId: string, organizationId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetchAdminBff(`/api/project-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.requests.detail(requestId),
      })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.projects.all })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.inbox.all })
      if (organizationId) {
        void queryClient.invalidateQueries({
          queryKey: adminQueryKeys.clients.activity(organizationId),
        })
      }
    },
  })
}

export function useCreateCheckpointMutation(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetchAdminBff<ProjectRequestItem>(`/api/projects/${projectId}/checkpoints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.projects.detail(projectId) })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.projects.all })
    },
  })
}

export function useApproveOnboardingMutation(projectId: string, organizationId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (requestId: string) =>
      fetchAdminBff<ProjectRequestItem>(`/api/project-requests/${requestId}/approve-onboarding`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.projects.detail(projectId) })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.projects.all })
      if (organizationId) {
        void queryClient.invalidateQueries({
          queryKey: adminQueryKeys.projects.byOrganization(organizationId),
        })
        void queryClient.invalidateQueries({ queryKey: adminQueryKeys.inbox.all })
      }
    },
  })
}

export function useCompleteProjectMutation(projectId: string, organizationId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      fetchAdminBff<ClientProjectSummary>(`/api/projects/${projectId}/complete`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.projects.detail(projectId) })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.projects.all })
      if (organizationId) {
        void queryClient.invalidateQueries({
          queryKey: adminQueryKeys.projects.byOrganization(organizationId),
        })
      }
    },
  })
}

export function useApproveClientProjectMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (projectId: string) =>
      fetchAdminBff(`/api/clients/${organizationId}/projects/${projectId}/approve`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.projects.all })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.projects.byOrganization(organizationId),
      })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.inbox.all })
    },
  })
}

export function useResolveCancellationMutation(requestId: string, organizationId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      outcome: string
      feeAmount?: number
      feeNotes?: string
      message?: string
    }) =>
      fetchAdminBff(`/api/project-requests/${requestId}/resolve-cancellation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.requests.detail(requestId),
      })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.projects.all })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.inbox.all })
      if (organizationId) {
        void queryClient.invalidateQueries({
          queryKey: adminQueryKeys.projects.byOrganization(organizationId),
        })
        void queryClient.invalidateQueries({
          queryKey: adminQueryKeys.clients.activity(organizationId),
        })
      }
    },
  })
}
