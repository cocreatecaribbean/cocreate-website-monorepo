'use client'

import { useQuery, type QueryClient } from '@tanstack/react-query'

import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'
import type { ClientProjectSummary, ProjectRequestItem } from '@/lib/projects/types'

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

export function useAdminRequestThreadQuery(requestId: string | null | undefined) {
  return useQuery({
    queryKey: adminQueryKeys.requests.detail(requestId ?? '__idle__'),
    queryFn: () => fetchAdminBff<ProjectRequestItem>(`/api/project-requests/${requestId}`),
    enabled: Boolean(requestId),
  })
}
