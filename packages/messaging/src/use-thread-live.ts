'use client'

import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { mergeThreadMessagesListWithCache } from '@cocreate/app-ui/thread-messages-list-cache'
import { appendThreadMessageToListCache, invalidateThreadMessagesList } from '@cocreate/app-ui/thread-messages-list-cache'
import { threadQueryOptions } from '@cocreate/app-ui/thread-live-query'
import {
  SERVER_THREAD_ATTACHMENT,
  SERVER_THREAD_CHECKPOINT,
  SERVER_THREAD_MESSAGE,
  SERVER_THREAD_STATUS,
  type ThreadCheckpointPayload,
  type ThreadMessagePayload,
} from './events'
import { useMessagingContext } from './messaging-provider'

const INVALIDATE_DEBOUNCE_MS = 50

function isProtectedKey(
  queryKey: QueryKey,
  messagesKey: QueryKey,
): boolean {
  return (
    Array.isArray(queryKey) &&
    Array.isArray(messagesKey) &&
    queryKey.length === messagesKey.length &&
    queryKey.every((part, index) => part === messagesKey[index])
  )
}

export function useThreadLive<T extends { id: string; createdAt?: string }>(
  requestId: string | undefined,
  options: {
    enabled?: boolean
    fetchMessages: (requestId: string) => Promise<T[]>
    invalidateQueryKeys?: QueryKey[]
    onThreadUpdate?: () => void
  },
) {
  const queryClient = useQueryClient()
  const { config, connected, joinThread, leaveThread, subscribe } = useMessagingContext()
  const onUpdateRef = useRef(options.onThreadUpdate)
  onUpdateRef.current = options.onThreadUpdate
  const keysRef = useRef(options.invalidateQueryKeys)
  keysRef.current = options.invalidateQueryKeys
  const fetchMessagesRef = useRef(options.fetchMessages)
  fetchMessagesRef.current = options.fetchMessages
  const configRef = useRef(config)
  configRef.current = config

  const enabled = options.enabled !== false && Boolean(requestId)
  const messagesKey = requestId
    ? config.threadMessagesQueryKey(requestId)
    : (['__thread_idle__'] as const)

  const messagesQuery = useQuery({
    queryKey: messagesKey,
    queryFn: async () => {
      const fetched = await fetchMessagesRef.current(requestId!)
      const cached = queryClient.getQueryData<T[]>(
        configRef.current.threadMessagesQueryKey(requestId!),
      )
      return mergeThreadMessagesListWithCache(cached, fetched)
    },
    enabled,
    ...threadQueryOptions<T[]>(false),
  })

  // Lightweight HTTP fallback when tab regains focus (socket may have missed an event).
  useEffect(() => {
    if (!enabled || !requestId) return

    const onFocus = () => {
      void queryClient.invalidateQueries({
        queryKey: configRef.current.threadMessagesQueryKey(requestId),
      })
    }

    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [enabled, queryClient, requestId])

  useEffect(() => {
    if (!enabled || !requestId || !connected) return

    joinThread(requestId)

    const invalidateNonMessageKeys = () => {
      const keys = keysRef.current
      const mKey = configRef.current.threadMessagesQueryKey(requestId)
      if (!keys?.length) return
      for (const queryKey of keys) {
        if (!isProtectedKey(queryKey, mKey)) {
          void queryClient.invalidateQueries({ queryKey })
        }
      }
    }

    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    const scheduleInvalidate = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        const keys = keysRef.current
        if (keys?.length) {
          for (const queryKey of keys) {
            void queryClient.invalidateQueries({ queryKey })
          }
        } else {
          onUpdateRef.current?.()
        }
      }, INVALIDATE_DEBOUNCE_MS)
    }

    const unsubMessage = subscribe(SERVER_THREAD_MESSAGE, (raw) => {
      const payload = raw as ThreadMessagePayload
      if (payload.requestId !== requestId || !payload.message) return

      const key = configRef.current.threadMessagesQueryKey(requestId)
      appendThreadMessageToListCache(queryClient, key, payload.message as T)

      if (process.env.NODE_ENV === 'development') {
        const count = queryClient.getQueryData<T[]>(key)?.length ?? 0
        console.info(
          `[${configRef.current.logLabel ?? 'messaging'}] thread:message`,
          requestId,
          { messageId: (payload.message as { id?: string }).id, cacheCount: count },
        )
      }
    })

    const unsubCheckpoint = subscribe(SERVER_THREAD_CHECKPOINT, (raw) => {
      const payload = raw as ThreadCheckpointPayload
      if (payload.requestId !== requestId) return
      invalidateThreadMessagesList(queryClient, configRef.current.threadMessagesQueryKey(requestId))
      invalidateNonMessageKeys()
    })

    const unsubAttachment = subscribe(SERVER_THREAD_ATTACHMENT, (raw) => {
      const payload = raw as ThreadCheckpointPayload
      if (payload.requestId !== requestId) return
      invalidateNonMessageKeys()
    })

    const unsubStatus = subscribe(SERVER_THREAD_STATUS, (raw) => {
      const payload = raw as ThreadCheckpointPayload
      if (payload.requestId !== requestId) return
      scheduleInvalidate()
    })

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      unsubMessage()
      unsubCheckpoint()
      unsubAttachment()
      unsubStatus()
      leaveThread(requestId)
    }
  }, [
    connected,
    enabled,
    joinThread,
    leaveThread,
    queryClient,
    requestId,
    subscribe,
  ])

  return {
    messages: messagesQuery.data,
    isLoading: messagesQuery.isLoading && !messagesQuery.data,
  }
}
