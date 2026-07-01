import type { QueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/query-keys'
import type { ProjectRequestItem, ProjectRequestMessage } from '@/lib/projects/api-types'

export function appendRequestMessageToCache(
  queryClient: QueryClient,
  requestId: string,
  message: ProjectRequestMessage,
): void {
  queryClient.setQueryData<ProjectRequestItem>(queryKeys.requests.detail(requestId), (old) => {
    if (!old) return old
    if (old.messages?.some((entry) => entry.id === message.id)) return old
    return {
      ...old,
      messages: [...(old.messages ?? []), message],
    }
  })
}
