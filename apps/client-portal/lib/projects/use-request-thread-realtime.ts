'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/api/query-keys'
import { authorizeRequestThreadRealtime } from '@/lib/projects/fetch-projects-client'
import { appendRequestMessageToCache } from '@/lib/projects/append-request-message-cache'
import {
  isThreadRealtimeEnabled,
  THREAD_REALTIME_EVENT,
  type ThreadRealtimePayload,
} from '@/lib/projects/thread-realtime'
import type { RealtimeChannel } from '@supabase/supabase-js'

const INVALIDATE_DEBOUNCE_MS = 50

export function useRequestThreadRealtime(
  requestId: string | undefined,
  onUpdate?: () => void,
  options?: { enabled?: boolean; invalidateQueryKeys?: QueryKey[] },
) {
  const queryClient = useQueryClient()
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate
  const invalidateQueryKeysRef = useRef(options?.invalidateQueryKeys)
  invalidateQueryKeysRef.current = options?.invalidateQueryKeys

  const enabled =
    isThreadRealtimeEnabled() && options?.enabled !== false && Boolean(requestId)

  useEffect(() => {
    if (!enabled || !requestId) return

    let cancelled = false
    let channel: RealtimeChannel | null = null
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const invalidateAll = () => {
      const keys = invalidateQueryKeysRef.current
      if (keys?.length) {
        for (const queryKey of keys) {
          void queryClient.invalidateQueries({ queryKey })
        }
      } else {
        onUpdateRef.current?.()
      }
    }

    const scheduleInvalidate = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (cancelled) return
        invalidateAll()
      }, INVALIDATE_DEBOUNCE_MS)
    }

    const handlePayload = (payload: ThreadRealtimePayload) => {
      if (payload.reason === 'message' && payload.message) {
        appendRequestMessageToCache(queryClient, requestId, payload.message)
        const hasAttachments =
          Boolean(payload.message.attachments?.length) ||
          Boolean(payload.message.attachmentIds?.length)
        if (hasAttachments) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.approvals.open() })
          void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
        }
        const keys = invalidateQueryKeysRef.current
        if (keys?.length) {
          for (const queryKey of keys) {
            const detailKey = queryKeys.requests.detail(requestId)
            const isDetail =
              Array.isArray(queryKey) &&
              queryKey.length === detailKey.length &&
              queryKey.every((part, index) => part === detailKey[index])
            if (!isDetail) {
              void queryClient.invalidateQueries({ queryKey })
            }
          }
        }
        return
      }
      if (payload.reason === 'checkpoint') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all })
        void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
      }
      scheduleInvalidate()
    }

    void (async () => {
      const auth = await authorizeRequestThreadRealtime(requestId)
      if (cancelled || !auth.ok || !auth.data.enabled || !auth.data.channel) return

      const supabase = createSupabaseBrowserClient()
      channel = supabase.channel(auth.data.channel)
      channel
        .on('broadcast', { event: THREAD_REALTIME_EVENT }, ({ payload }) => {
          handlePayload(payload as ThreadRealtimePayload)
        })
        .subscribe()
    })()

    return () => {
      cancelled = true
      if (debounceTimer) clearTimeout(debounceTimer)
      if (channel) {
        void createSupabaseBrowserClient().removeChannel(channel)
      }
    }
  }, [enabled, queryClient, requestId])
}
