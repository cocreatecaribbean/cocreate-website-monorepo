'use client'

import { useQuery, type QueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import {
  fetchAttachmentDownloadUrl,
  fetchClientRecentActivity,
  fetchDashboardStats,
  fetchProject,
  fetchProjects,
  fetchRequestThread,
} from '@/lib/projects/fetch-projects-client'

const FIVE_MINUTES = 5 * 60 * 1000
const TWO_MINUTES = 2 * 60 * 1000
const FIFTY_MINUTES = 50 * 60 * 1000

async function fetchRequestThreadData(requestId: string) {
  const result = await fetchRequestThread(requestId)
  if (!result.ok) throw new Error(result.message)
  return result.data
}

export function prefetchRequestThread(queryClient: QueryClient, requestId: string) {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.requests.detail(requestId),
    queryFn: () => fetchRequestThreadData(requestId),
    staleTime: TWO_MINUTES,
  })
}

export function useProjectsQuery() {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: fetchProjects,
    staleTime: FIVE_MINUTES,
  })
}

export function useProjectQuery(projectId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId ?? ''),
    queryFn: () => fetchProject(projectId!),
    enabled: Boolean(projectId),
    staleTime: TWO_MINUTES,
  })
}

export function prefetchClientProjectOverview(
  queryClient: QueryClient,
  projectId: string,
) {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => fetchProject(projectId, 'overview'),
    staleTime: TWO_MINUTES,
  })
}

export function useDashboardStatsQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: fetchDashboardStats,
  })
}

export function useClientRecentActivityQuery(limit = 15) {
  return useQuery({
    queryKey: queryKeys.dashboard.recentActivity(limit),
    queryFn: () => fetchClientRecentActivity(limit),
  })
}

export function useRequestThreadQuery(requestId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.requests.detail(requestId ?? ''),
    queryFn: () => fetchRequestThreadData(requestId!),
    enabled: Boolean(requestId),
    staleTime: TWO_MINUTES,
    gcTime: FIVE_MINUTES,
    placeholderData: (previous) => previous,
  })
}

export function useAttachmentDownloadUrl(
  attachmentId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const queryEnabled = Boolean(attachmentId) && (options?.enabled ?? true)
  return useQuery({
    queryKey: queryKeys.attachments.downloadUrl(attachmentId ?? ''),
    queryFn: () => fetchAttachmentDownloadUrl(attachmentId!),
    enabled: queryEnabled,
    staleTime: FIFTY_MINUTES,
    retry: 1,
  })
}
