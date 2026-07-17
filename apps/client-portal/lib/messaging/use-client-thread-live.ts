'use client'

import type { QueryKey } from '@tanstack/react-query'
import { useThreadLive } from '@cocreate/messaging/use-thread-live'
import { matchPendingRequestMessage } from '@/lib/messaging/match-pending-request-message'
import { fetchRequestThread } from '@/lib/projects/fetch-projects-client'
import type { ProjectRequestMessage } from '@/lib/projects/api-types'

async function fetchThreadMessages(requestId: string): Promise<ProjectRequestMessage[]> {
  const result = await fetchRequestThread(requestId)
  if (!result.ok) throw new Error(result.message)
  return result.data.messages ?? []
}

export function useClientThreadLive(
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
    fetchMessages: fetchThreadMessages,
  })
}
