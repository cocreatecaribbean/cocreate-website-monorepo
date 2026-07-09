import type { QueryClient } from '@tanstack/react-query'
import {
  addOptimisticRequestMessageToCache as addOptimisticRequestMessageToCacheBase,
  appendRequestMessageToCache as appendRequestMessageToCacheBase,
  appendRequestMessageToCacheOrInvalidate as appendRequestMessageToCacheOrInvalidateBase,
  invalidateRequestThreadDetail as invalidateRequestThreadDetailBase,
  replacePendingRequestMessageInCache as replacePendingRequestMessageInCacheBase,
  rollbackOptimisticRequestMessageInCache as rollbackOptimisticRequestMessageInCacheBase,
} from '@cocreate/app-ui/thread-message-cache'

import { adminQueryKeys } from '@/lib/api/query-keys'
import type { ProjectRequestItem, ProjectRequestMessage } from '@/lib/projects/types'

function detailKey(requestId: string) {
  return adminQueryKeys.requests.detail(requestId)
}

export function invalidateRequestThreadDetail(
  queryClient: QueryClient,
  requestId: string,
): void {
  invalidateRequestThreadDetailBase(queryClient, detailKey(requestId))
}

export function appendRequestMessageToCache(
  queryClient: QueryClient,
  requestId: string,
  message: ProjectRequestMessage,
): boolean {
  return appendRequestMessageToCacheBase<ProjectRequestItem, ProjectRequestMessage>(
    queryClient,
    detailKey(requestId),
    message,
  )
}

export function appendRequestMessageToCacheOrInvalidate(
  queryClient: QueryClient,
  requestId: string,
  message: ProjectRequestMessage,
): void {
  appendRequestMessageToCacheOrInvalidateBase<ProjectRequestItem, ProjectRequestMessage>(
    queryClient,
    detailKey(requestId),
    message,
  )
}

export function addOptimisticRequestMessageToCache(
  queryClient: QueryClient,
  requestId: string,
  message: ProjectRequestMessage,
  seed?: ProjectRequestItem,
): void {
  addOptimisticRequestMessageToCacheBase<ProjectRequestItem, ProjectRequestMessage>(
    queryClient,
    detailKey(requestId),
    message,
    seed,
  )
}

export function replacePendingRequestMessageInCache(
  queryClient: QueryClient,
  requestId: string,
  pendingId: string,
  serverMessage: ProjectRequestMessage,
): boolean {
  return replacePendingRequestMessageInCacheBase<ProjectRequestItem, ProjectRequestMessage>(
    queryClient,
    detailKey(requestId),
    pendingId,
    serverMessage,
  )
}

export function rollbackOptimisticRequestMessageInCache(
  queryClient: QueryClient,
  requestId: string,
  pendingId: string,
): void {
  rollbackOptimisticRequestMessageInCacheBase<ProjectRequestItem>(
    queryClient,
    detailKey(requestId),
    pendingId,
  )
}
