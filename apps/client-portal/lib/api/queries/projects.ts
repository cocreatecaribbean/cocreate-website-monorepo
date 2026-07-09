'use client'

import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { threadQueryOptions } from '@cocreate/app-ui/thread-live-query'
import { mergeThreadDetailWithCache } from '@cocreate/app-ui/thread-message-cache'
import { mergeThreadMessagesListWithCache } from '@cocreate/app-ui/thread-messages-list-cache'

import type { ProjectRequestItem, ProjectRequestMessage } from '@/lib/projects/api-types'
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
    queryKey: queryKeys.requests.messages(requestId),
    queryFn: async () => {
      const fetched = await fetchRequestThreadData(requestId)
      return fetched.messages ?? []
    },
    staleTime: TWO_MINUTES,
  })
}

export function useProjectsQuery() {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: async () => {
      const page = await fetchProjects()
      return page.projects
    },
    staleTime: FIVE_MINUTES,
  })
}

export function useProjectsInfiniteQuery() {
  return useQuery({
    queryKey: [...queryKeys.projects.list(), 'paginated'] as const,
    queryFn: () => fetchProjects({ limit: 30 }),
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

export function useRequestThreadMessagesQuery(
  requestId: string | null | undefined,
  options?: { pollFallback?: boolean; watchdog?: boolean; enabled?: boolean },
) {
  const queryClient = useQueryClient()
  const pollFallback = options?.pollFallback ?? false
  const watchdog = options?.watchdog ?? false
  const messagesKey = queryKeys.requests.messages(requestId ?? '')
  return useQuery({
    queryKey: messagesKey,
    queryFn: async () => {
      const fetched = await fetchRequestThreadData(requestId!)
      const messages = fetched.messages ?? []
      const cached = queryClient.getQueryData<ProjectRequestMessage[]>(
        queryKeys.requests.messages(requestId!),
      )
      return mergeThreadMessagesListWithCache(cached, messages)
    },
    enabled: options?.enabled !== false && Boolean(requestId),
    gcTime: FIVE_MINUTES,
    ...threadQueryOptions<ProjectRequestMessage[]>({ pollFallback, watchdog }),
  })
}

export function useRequestThreadQuery(
  requestId: string | null | undefined,
  options?: { pollFallback?: boolean },
) {
  const queryClient = useQueryClient()
  const pollFallback = options?.pollFallback ?? false
  const detailKey = queryKeys.requests.detail(requestId ?? '')
  return useQuery({
    queryKey: detailKey,
    queryFn: async () => {
      const fetched = await fetchRequestThreadData(requestId!)
      const cached = queryClient.getQueryData<ProjectRequestItem>(
        queryKeys.requests.detail(requestId!),
      )
      return mergeThreadDetailWithCache(cached, fetched)
    },
    enabled: Boolean(requestId),
    gcTime: FIVE_MINUTES,
    ...threadQueryOptions<ProjectRequestItem>(pollFallback),
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
