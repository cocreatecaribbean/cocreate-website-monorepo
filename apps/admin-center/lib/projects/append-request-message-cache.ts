import type { QueryClient } from '@tanstack/react-query'
import { mergeRequestMessageIntoThread } from '@cocreate/app-ui/thread-message-merge'

import { adminQueryKeys } from '@/lib/api/query-keys'
import type { ProjectRequestItem, ProjectRequestMessage } from '@/lib/projects/types'

export function appendRequestMessageToCache(
  queryClient: QueryClient,
  requestId: string,
  message: ProjectRequestMessage,
): void {
  queryClient.setQueryData<ProjectRequestItem>(adminQueryKeys.requests.detail(requestId), (old) => {
    if (!old) return old
    return mergeRequestMessageIntoThread(old, message)
  })
}
