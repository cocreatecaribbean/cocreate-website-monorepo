import { useQuery } from '@tanstack/react-query'

import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'
import {
  mapThreadApprovalItemsFromApi,
  type ThreadApprovalItem,
} from '@/lib/projects/thread-approval-items'

const APPROVALS_STALE_MS = 30 * 1000

export function useProjectApprovalItemsQuery(
  projectId: string | null | undefined,
  options?: { includeComments?: boolean; enabled?: boolean },
) {
  const includeComments = options?.includeComments ?? false
  return useQuery<ThreadApprovalItem[]>({
    queryKey: adminQueryKeys.approvals.project(projectId ?? '', { includeComments }),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (includeComments) params.set('includeComments', 'true')
      const query = params.size > 0 ? `?${params.toString()}` : ''
      const data = await fetchAdminBff<{ items: Parameters<typeof mapThreadApprovalItemsFromApi>[0] }>(
        `/api/projects/${projectId}/approvals${query}`,
      )
      return mapThreadApprovalItemsFromApi(data.items ?? [])
    },
    staleTime: APPROVALS_STALE_MS,
    enabled: Boolean(projectId) && (options?.enabled ?? true),
  })
}
