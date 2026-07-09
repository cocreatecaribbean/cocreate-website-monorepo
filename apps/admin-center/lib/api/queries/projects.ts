'use client'

import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { threadQueryOptions } from '@cocreate/app-ui/thread-live-query'
import { mergeThreadDetailWithCache } from '@cocreate/app-ui/thread-message-cache'
import { mergeThreadMessagesListWithCache } from '@cocreate/app-ui/thread-messages-list-cache'

import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'
import type { ClientProjectSummary, ProjectRequestItem, ProjectRequestMessage } from '@/lib/projects/types'

const FIVE_MINUTES = 5 * 60 * 1000
const TWO_MINUTES = 2 * 60 * 1000

async function fetchAdminProjects(): Promise<ClientProjectSummary[]> {
  return fetchAdminBff<ClientProjectSummary[]>('/api/projects')
}

export type AdminProjectWorkspace = {
  project: ClientProjectSummary
  clientName: string
  unreadCount: number
}

export function useAdminProjectsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.projects.list(),
    queryFn: fetchAdminProjects,
    staleTime: FIVE_MINUTES,
  })
}

export function useAdminProjectQuery(projectId: string) {
  return useQuery({
    queryKey: adminQueryKeys.projects.detail(projectId),
    queryFn: () =>
      fetchAdminBff<ClientProjectSummary>(`/api/projects/${projectId}?view=overview`),
    enabled: Boolean(projectId),
    staleTime: TWO_MINUTES,
  })
}

export function useAdminProjectWorkspaceQuery(organizationId: string, projectId: string) {
  return useQuery({
    queryKey: adminQueryKeys.projects.workspace(organizationId, projectId),
    queryFn: () =>
      fetchAdminBff<AdminProjectWorkspace>(
        `/api/clients/${organizationId}/projects/${projectId}/workspace`,
      ),
    enabled: Boolean(organizationId && projectId),
    staleTime: TWO_MINUTES,
  })
}

export function prefetchAdminProjectOverview(
  queryClient: QueryClient,
  projectId: string,
) {
  return queryClient.prefetchQuery({
    queryKey: adminQueryKeys.projects.detail(projectId),
    queryFn: () =>
      fetchAdminBff<ClientProjectSummary>(`/api/projects/${projectId}?view=overview`),
    staleTime: TWO_MINUTES,
  })
}

export function useAdminRequestThreadMessagesQuery(
  requestId: string | null | undefined,
  options?: { pollFallback?: boolean; watchdog?: boolean; enabled?: boolean },
) {
  const queryClient = useQueryClient()
  const pollFallback = options?.pollFallback ?? false
  const watchdog = options?.watchdog ?? false
  const messagesKey = adminQueryKeys.requests.messages(requestId ?? '__idle__')
  return useQuery({
    queryKey: messagesKey,
    queryFn: async () => {
      const thread = await fetchAdminBff<ProjectRequestItem>(
        `/api/project-requests/${requestId}`,
      )
      const fetched = thread.messages ?? []
      const cached = queryClient.getQueryData<ProjectRequestMessage[]>(
        adminQueryKeys.requests.messages(requestId!),
      )
      return mergeThreadMessagesListWithCache(cached, fetched)
    },
    enabled: options?.enabled !== false && Boolean(requestId),
    ...threadQueryOptions<ProjectRequestMessage[]>({ pollFallback, watchdog }),
  })
}

export function useAdminRequestThreadQuery(
  requestId: string | null | undefined,
  options?: { pollFallback?: boolean },
) {
  const queryClient = useQueryClient()
  const pollFallback = options?.pollFallback ?? false
  const detailKey = adminQueryKeys.requests.detail(requestId ?? '__idle__')
  return useQuery({
    queryKey: detailKey,
    queryFn: async () => {
      const fetched = await fetchAdminBff<ProjectRequestItem>(
        `/api/project-requests/${requestId}`,
      )
      const cached = queryClient.getQueryData<ProjectRequestItem>(
        adminQueryKeys.requests.detail(requestId!),
      )
      return mergeThreadDetailWithCache(cached, fetched)
    },
    enabled: Boolean(requestId),
    ...threadQueryOptions<ProjectRequestItem>(pollFallback),
  })
}
