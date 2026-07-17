import type { QueryClient, QueryKey } from '@tanstack/react-query'

export type ThreadMessageListItem = {
  id: string
  createdAt?: string
}

export type MatchPendingThreadMessage<T extends ThreadMessageListItem> = (
  pending: T,
  incoming: T,
) => boolean

function isPendingMessageId(id: string): boolean {
  return id.startsWith('pending-')
}

export function appendThreadMessageToList<T extends ThreadMessageListItem>(
  messages: T[] | undefined,
  message: T,
  matchPending?: MatchPendingThreadMessage<T>,
): T[] {
  const current = messages ?? []
  if (current.some((entry) => entry.id === message.id)) return current

  if (matchPending && !isPendingMessageId(message.id)) {
    const pendingIndex = current.findIndex(
      (entry) => isPendingMessageId(entry.id) && matchPending(entry, message),
    )
    if (pendingIndex >= 0) {
      const next = [...current]
      next[pendingIndex] = message
      return next
    }
  }

  return [...current, message]
}

export function mergeThreadMessagesListWithCache<T extends ThreadMessageListItem>(
  cached: T[] | undefined,
  fetched: T[],
): T[] {
  if (!cached?.length) return fetched

  const messageMap = new Map<string, T>()
  for (const message of fetched) {
    messageMap.set(message.id, message)
  }
  for (const message of cached) {
    if (isPendingMessageId(message.id)) {
      if (!messageMap.has(message.id)) {
        messageMap.set(message.id, message)
      }
      continue
    }
    if (!messageMap.has(message.id)) {
      messageMap.set(message.id, message)
    }
  }

  return [...messageMap.values()].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return aTime - bTime
  })
}

export function replacePendingThreadMessageInList<T extends ThreadMessageListItem>(
  messages: T[],
  pendingId: string,
  serverMessage: T,
): T[] {
  const withoutPending = messages.filter((entry) => entry.id !== pendingId)
  if (withoutPending.some((entry) => entry.id === serverMessage.id)) {
    return withoutPending
  }
  return [...withoutPending, serverMessage]
}

export function rollbackPendingThreadMessageInList<T extends ThreadMessageListItem>(
  messages: T[],
  pendingId: string,
): T[] {
  return messages.filter((entry) => entry.id !== pendingId)
}

export function appendThreadMessageToListCache<T extends ThreadMessageListItem>(
  queryClient: QueryClient,
  messagesQueryKey: QueryKey,
  message: T,
  matchPending?: MatchPendingThreadMessage<T>,
): void {
  queryClient.setQueryData<T[]>(messagesQueryKey, (current) =>
    appendThreadMessageToList(current, message, matchPending),
  )
}

export function addOptimisticThreadMessageToListCache<T extends ThreadMessageListItem>(
  queryClient: QueryClient,
  messagesQueryKey: QueryKey,
  message: T,
): void {
  queryClient.setQueryData<T[]>(messagesQueryKey, (current) =>
    appendThreadMessageToList(current, message),
  )
}

export function replacePendingThreadMessageInListCache<T extends ThreadMessageListItem>(
  queryClient: QueryClient,
  messagesQueryKey: QueryKey,
  pendingId: string,
  serverMessage: T,
): boolean {
  let applied = false
  queryClient.setQueryData<T[]>(messagesQueryKey, (current) => {
    if (!current) return current
    applied = true
    return replacePendingThreadMessageInList(current, pendingId, serverMessage)
  })
  return applied
}

export function rollbackOptimisticThreadMessageInListCache<T extends ThreadMessageListItem>(
  queryClient: QueryClient,
  messagesQueryKey: QueryKey,
  pendingId: string,
): void {
  queryClient.setQueryData<T[]>(messagesQueryKey, (current) => {
    if (!current) return current
    return rollbackPendingThreadMessageInList(current, pendingId)
  })
}

export function invalidateThreadMessagesList(
  queryClient: QueryClient,
  messagesQueryKey: QueryKey,
): void {
  void queryClient.invalidateQueries({ queryKey: messagesQueryKey })
}
