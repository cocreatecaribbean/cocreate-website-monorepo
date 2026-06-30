'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { authorizeRequestThreadRealtime } from '@/lib/projects/fetch-projects-client'
import {
  isThreadRealtimeEnabled,
  THREAD_REALTIME_EVENT,
} from '@/lib/projects/thread-realtime'
import type { RealtimeChannel } from '@supabase/supabase-js'

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

    const scheduleUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (cancelled) return
        const keys = invalidateQueryKeysRef.current
        if (keys?.length) {
          for (const queryKey of keys) {
            void queryClient.invalidateQueries({ queryKey })
          }
        } else {
          onUpdateRef.current?.()
        }
      }, 300)
    }

    void (async () => {
      const auth = await authorizeRequestThreadRealtime(requestId)
      if (cancelled || !auth.ok || !auth.data.enabled || !auth.data.channel) return

      const supabase = createSupabaseBrowserClient()
      channel = supabase.channel(auth.data.channel)
      channel
        .on('broadcast', { event: THREAD_REALTIME_EVENT }, () => {
          scheduleUpdate()
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
