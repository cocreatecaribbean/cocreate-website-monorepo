'use client'

import type { QueryKey } from '@tanstack/react-query'
import { useThreadLive } from '@cocreate/messaging/use-thread-live'
import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { matchPendingRequestMessage } from '@/lib/messaging/match-pending-request-message'
import type { ProjectRequestItem, ProjectRequestMessage } from '@/lib/projects/types'

export function useAdminThreadLive(
  requestId: string | undefined,
  options?: {
    enabled?: boolean
    onThreadUpdate?: () => void
    onAttachmentUpdate?: () => void
    invalidateQueryKeys?: QueryKey[]
  },
) {
  return useThreadLive<ProjectRequestMessage>(requestId, {
    enabled: options?.enabled,
    onThreadUpdate: options?.onThreadUpdate,
    onAttachmentUpdate: options?.onAttachmentUpdate,
    invalidateQueryKeys: options?.invalidateQueryKeys,
    matchPendingMessage: matchPendingRequestMessage,
    fetchMessages: async (id) => {
      const thread = await fetchAdminBff<ProjectRequestItem>(`/api/project-requests/${id}`)
      return thread.messages ?? []
    },
  })
}
