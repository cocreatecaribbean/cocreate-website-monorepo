'use client'

import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { threadQueryOptions } from '@cocreate/app-ui/thread-live-query'
import { SERVER_INBOX_MESSAGE, type InboxMessagePayload } from './events'
import { useMessagingContext } from './messaging-provider'

function isInboxMessagesKey(key: QueryKey, conversationId: string): boolean {
  return (
    Array.isArray(key) &&
    key.includes('messages') &&
    key.includes(conversationId)
  )
}

export function useInboxLive<T extends { id: string }>(
  conversationId: string | undefined,
  options: {
    enabled?: boolean
    fetchMessages: (conversationId: string) => Promise<T[]>
    appendMessage: (current: T[] | undefined, message: T) => T[]
    invalidateQueryKeys?: QueryKey[]
  },
) {
  const queryClient = useQueryClient()
  const { config, connected, joinInbox, leaveInbox, subscribe } = useMessagingContext()
  const keysRef = useRef(options.invalidateQueryKeys)
  keysRef.current = options.invalidateQueryKeys
  const appendMessageRef = useRef(options.appendMessage)
  appendMessageRef.current = options.appendMessage
  const fetchMessagesRef = useRef(options.fetchMessages)
  fetchMessagesRef.current = options.fetchMessages
  const configRef = useRef(config)
  configRef.current = config

  const enabled = options.enabled !== false && Boolean(conversationId)
  const messagesKey = conversationId
    ? config.inboxMessagesQueryKey(conversationId)
    : (['__inbox_idle__'] as const)

  const messagesQuery = useQuery({
    queryKey: messagesKey,
    queryFn: () => fetchMessagesRef.current(conversationId!),
    enabled,
    ...threadQueryOptions<T[]>(false),
  })

  useEffect(() => {
    if (!enabled || !conversationId || !connected) return

    joinInbox(conversationId)

    const invalidateNonMessageKeys = () => {
      const keys = keysRef.current
      if (!keys?.length) return
      for (const queryKey of keys) {
        if (!isInboxMessagesKey(queryKey, conversationId)) {
          void queryClient.invalidateQueries({ queryKey })
        }
      }
    }

    const unsub = subscribe(SERVER_INBOX_MESSAGE, (raw) => {
      const payload = raw as InboxMessagePayload
      if (payload.conversationId !== conversationId || !payload.message) return
      if (process.env.NODE_ENV === 'development') {
        console.info(
          `[${configRef.current.logLabel ?? 'messaging'}] inbox:message`,
          conversationId,
        )
      }
      queryClient.setQueryData<T[]>(
        configRef.current.inboxMessagesQueryKey(conversationId),
        (current) => appendMessageRef.current(current, payload.message as T),
      )
      invalidateNonMessageKeys()
    })

    return () => {
      unsub()
      leaveInbox(conversationId)
    }
  }, [connected, conversationId, enabled, joinInbox, leaveInbox, queryClient, subscribe])

  return {
    messages: messagesQuery.data,
    isLoading: messagesQuery.isLoading && !messagesQuery.data,
  }
}
