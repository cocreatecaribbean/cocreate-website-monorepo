import type { QueryClient } from '@tanstack/react-query'
import {
  addOptimisticThreadMessageToListCache,
  appendThreadMessageToListCache,
  invalidateThreadMessagesList,
  replacePendingThreadMessageInListCache,
  rollbackOptimisticThreadMessageInListCache,
} from '@cocreate/app-ui/thread-messages-list-cache'

import { queryKeys } from '@/lib/api/query-keys'
import type { ProjectRequestMessage } from '@/lib/projects/api-types'

function messagesKey(requestId: string) {
  return queryKeys.requests.messages(requestId)
}

export function invalidateRequestThreadMessages(
  queryClient: QueryClient,
  requestId: string,
): void {
  invalidateThreadMessagesList(queryClient, messagesKey(requestId))
}

export function appendRequestMessageToMessagesList(
  queryClient: QueryClient,
  requestId: string,
  message: ProjectRequestMessage,
): void {
  appendThreadMessageToListCache(queryClient, messagesKey(requestId), message)
}

export function addOptimisticRequestMessageToMessagesList(
  queryClient: QueryClient,
  requestId: string,
  message: ProjectRequestMessage,
): void {
  addOptimisticThreadMessageToListCache(queryClient, messagesKey(requestId), message)
}

export function replacePendingRequestMessageInMessagesList(
  queryClient: QueryClient,
  requestId: string,
  pendingId: string,
  serverMessage: ProjectRequestMessage,
): boolean {
  return replacePendingThreadMessageInListCache(
    queryClient,
    messagesKey(requestId),
    pendingId,
    serverMessage,
  )
}

export function rollbackOptimisticRequestMessageInMessagesList(
  queryClient: QueryClient,
  requestId: string,
  pendingId: string,
): void {
  rollbackOptimisticThreadMessageInListCache(queryClient, messagesKey(requestId), pendingId)
}
