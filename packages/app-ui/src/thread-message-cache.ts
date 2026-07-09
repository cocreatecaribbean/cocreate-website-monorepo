import type { QueryClient, QueryKey } from '@tanstack/react-query'

import {
  mergeRequestMessageIntoThread,
  type ThreadMessageLike,
  type ThreadRequestLike,
} from './thread-message-merge'

export type ThreadMessageCacheItem = {
  id: string
  messages?: Array<{ id: string }>
  messageCount?: number
}

function isPendingMessageId(id: string): boolean {
  return id.startsWith('pending-')
}

/** Union HTTP refetch with cache so realtime merges and pending sends are never dropped. */
export function mergeThreadDetailWithCache<
  TRequest extends ThreadRequestLike,
  TMessage extends ThreadMessageLike & { id: string; createdAt?: string },
>(cached: TRequest | undefined, fetched: TRequest): TRequest {
  if (!cached) return fetched

  const messageMap = new Map<string, TMessage>()
  for (const message of fetched.messages ?? []) {
    messageMap.set(message.id, message as TMessage)
  }
  for (const message of cached.messages ?? []) {
    const id = message.id
    if (isPendingMessageId(id)) {
      if (!messageMap.has(id)) {
        messageMap.set(id, message as TMessage)
      }
      continue
    }
    if (!messageMap.has(id)) {
      messageMap.set(id, message as TMessage)
    }
  }

  const messages = [...messageMap.values()].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return aTime - bTime
  })

  const attachmentMap = new Map<string, NonNullable<TRequest['attachments']>[number]>()
  for (const attachment of fetched.attachments ?? []) {
    attachmentMap.set(attachment.id, attachment)
  }
  for (const attachment of cached.attachments ?? []) {
    if (!attachmentMap.has(attachment.id)) {
      attachmentMap.set(attachment.id, attachment)
    }
  }

  return {
    ...fetched,
    messages,
    attachments: attachmentMap.size ? [...attachmentMap.values()] : fetched.attachments,
    messageCount: messages.length,
  }
}

export function invalidateRequestThreadDetail(
  queryClient: QueryClient,
  detailQueryKey: QueryKey,
): void {
  void queryClient.invalidateQueries({ queryKey: detailQueryKey })
}

export function appendRequestMessageToCache<
  TRequest extends ThreadRequestLike,
  TMessage extends NonNullable<TRequest['messages']>[number],
>(
  queryClient: QueryClient,
  detailQueryKey: QueryKey,
  message: TMessage,
): boolean {
  let applied = false
  queryClient.setQueryData<TRequest>(detailQueryKey, (old) => {
    if (!old) return old
    applied = true
    return mergeRequestMessageIntoThread(old, message)
  })
  return applied
}

export function appendRequestMessageToCacheOrInvalidate<
  TRequest extends ThreadRequestLike,
  TMessage extends NonNullable<TRequest['messages']>[number],
>(
  queryClient: QueryClient,
  detailQueryKey: QueryKey,
  message: TMessage,
): void {
  const applied = appendRequestMessageToCache<TRequest, TMessage>(
    queryClient,
    detailQueryKey,
    message,
  )
  if (!applied) {
    invalidateRequestThreadDetail(queryClient, detailQueryKey)
  }
}

export function addOptimisticRequestMessageToCache<
  TRequest extends ThreadRequestLike,
  TMessage extends NonNullable<TRequest['messages']>[number],
>(
  queryClient: QueryClient,
  detailQueryKey: QueryKey,
  message: TMessage,
  seed?: TRequest,
): void {
  queryClient.setQueryData<TRequest>(detailQueryKey, (old) => {
    const base = old ?? seed
    if (!base) return old
    return mergeRequestMessageIntoThread(base, message)
  })
}

export function replacePendingRequestMessageInCache<
  TRequest extends ThreadRequestLike,
  TMessage extends NonNullable<TRequest['messages']>[number],
>(
  queryClient: QueryClient,
  detailQueryKey: QueryKey,
  pendingId: string,
  serverMessage: TMessage,
): boolean {
  let applied = false
  queryClient.setQueryData<TRequest>(detailQueryKey, (old) => {
    if (!old) return old
    const withoutPending = (old.messages ?? []).filter((entry) => entry.id !== pendingId)
    applied = true
    return mergeRequestMessageIntoThread({ ...old, messages: withoutPending }, serverMessage)
  })
  return applied
}

export function rollbackOptimisticRequestMessageInCache<TRequest extends ThreadMessageCacheItem>(
  queryClient: QueryClient,
  detailQueryKey: QueryKey,
  pendingId: string,
): void {
  queryClient.setQueryData<TRequest>(detailQueryKey, (old) => {
    if (!old) return old
    const messages = (old.messages ?? []).filter((entry) => entry.id !== pendingId)
    return {
      ...old,
      messages,
      messageCount: messages.length,
    }
  })
}
