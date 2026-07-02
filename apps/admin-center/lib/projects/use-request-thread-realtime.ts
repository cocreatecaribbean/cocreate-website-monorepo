'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { adminQueryKeys } from '@/lib/api/query-keys'
import { appendRequestMessageToCache } from '@/lib/projects/append-request-message-cache'
import {
  isThreadRealtimeEnabled,
  THREAD_REALTIME_EVENT,
  type ThreadRealtimePayload,
} from '@/lib/projects/thread-realtime'
import type { RealtimeChannel } from '@supabase/supabase-js'

const INVALIDATE_DEBOUNCE_MS = 50

async function authorizeRequestThreadRealtime(requestId: string) {
  return fetchAdminBff<{ enabled: boolean; channel: string }>(
    `/api/project-requests/${requestId}/realtime`,
  )
}

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

    const invalidateNonDetailKeys = () => {
      const keys = invalidateQueryKeysRef.current
      if (!keys?.length) return
      const detailKey = adminQueryKeys.requests.detail(requestId)
      for (const queryKey of keys) {
        const isDetail =
          Array.isArray(queryKey) &&
          queryKey.length === detailKey.length &&
          queryKey.every((part, index) => part === detailKey[index])
        if (!isDetail) {
          void queryClient.invalidateQueries({ queryKey })
        }
      }
    }

    const handlePayload = (payload: ThreadRealtimePayload) => {
    if (payload.reason === 'message' && payload.message) {
      appendRequestMessageToCache(queryClient, requestId, payload.message)
      const hasAttachments =
        Boolean(payload.message.attachments?.length) ||
        Boolean(payload.message.attachmentIds?.length)
      if (hasAttachments) {
        invalidateNonDetailKeys()
      } else {
        invalidateNonDetailKeys()
      }
      return
    }
    if (payload.reason === 'checkpoint') {
      invalidateNonDetailKeys()
      scheduleInvalidate()
      return
    }
      if (payload.reason === 'attachment') {
        invalidateNonDetailKeys()
        return
      }
      scheduleInvalidate()
    }

    void (async () => {
      try {
        const auth = await authorizeRequestThreadRealtime(requestId)
        if (cancelled || !auth.enabled || !auth.channel) return

        const supabase = createSupabaseBrowserClient()
        channel = supabase.channel(auth.channel)
        channel
          .on('broadcast', { event: THREAD_REALTIME_EVENT }, ({ payload }) => {
            handlePayload(payload as ThreadRealtimePayload)
          })
          .subscribe()
      } catch {
        // Realtime is optional; ignore auth/subscribe failures
      }
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
