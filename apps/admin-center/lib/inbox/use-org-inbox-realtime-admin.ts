'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { authorizeAdminOrgInboxRealtime } from '@/lib/inbox/fetch-org-inbox-admin'
import {
  isOrgInboxRealtimeEnabled,
  ORG_INBOX_REALTIME_EVENT,
} from '@/lib/inbox/org-inbox-realtime'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useAdminOrgInboxRealtime(
  conversationId: string | undefined,
  invalidateQueryKeys?: QueryKey[],
) {
  const queryClient = useQueryClient()
  const keysRef = useRef(invalidateQueryKeys)
  keysRef.current = invalidateQueryKeys

  useEffect(() => {
    if (!isOrgInboxRealtimeEnabled() || !conversationId) return

    let cancelled = false
    let channel: RealtimeChannel | null = null
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const scheduleUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (cancelled) return
        const keys = keysRef.current
        if (keys?.length) {
          for (const queryKey of keys) {
            void queryClient.invalidateQueries({ queryKey })
          }
        }
      }, 300)
    }

    void (async () => {
      try {
        const auth = await authorizeAdminOrgInboxRealtime(conversationId)
        if (cancelled || !auth?.enabled || !auth.channel) return

        const supabase = createSupabaseBrowserClient()
        channel = supabase.channel(auth.channel)
        channel
          .on('broadcast', { event: ORG_INBOX_REALTIME_EVENT }, () => {
            scheduleUpdate()
          })
          .subscribe()
      } catch {
        // optional
      }
    })()

    return () => {
      cancelled = true
      if (debounceTimer) clearTimeout(debounceTimer)
      if (channel) void createSupabaseBrowserClient().removeChannel(channel)
    }
  }, [conversationId, queryClient])
}
