'use client'

import { useEffect, useRef } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { fetchAdminBff } from '@/lib/admin-api-fetch'
import {
  isThreadRealtimeEnabled,
  THREAD_REALTIME_EVENT,
} from '@/lib/projects/thread-realtime'
import type { RealtimeChannel } from '@supabase/supabase-js'

async function authorizeRequestThreadRealtime(requestId: string) {
  return fetchAdminBff<{ enabled: boolean; channel: string }>(
    `/api/project-requests/${requestId}/realtime`,
  )
}

export function useRequestThreadRealtime(
  requestId: string | undefined,
  onUpdate: () => void,
  options?: { enabled?: boolean },
) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

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
        if (!cancelled) onUpdateRef.current()
      }, 300)
    }

    void (async () => {
      try {
        const auth = await authorizeRequestThreadRealtime(requestId)
        if (cancelled || !auth.enabled || !auth.channel) return

        const supabase = createSupabaseBrowserClient()
        channel = supabase.channel(auth.channel)
        channel
          .on('broadcast', { event: THREAD_REALTIME_EVENT }, () => {
            scheduleUpdate()
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
  }, [enabled, requestId])
}
