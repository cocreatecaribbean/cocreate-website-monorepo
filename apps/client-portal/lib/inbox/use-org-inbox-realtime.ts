'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/api/query-keys'
import { authorizeOrgInboxRealtime } from '@/lib/inbox/fetch-inbox-client'
import type { OrgInboxMessage } from '@/lib/inbox/fetch-inbox-client'
import { appendInboxMessageToCache } from '@/lib/inbox/optimistic-inbox-message'
import {
  isOrgInboxRealtimeEnabled,
  ORG_INBOX_REALTIME_EVENT,
  type OrgInboxRealtimePayload,
} from '@/lib/inbox/org-inbox-realtime'
import type { RealtimeChannel } from '@supabase/supabase-js'

const INVALIDATE_DEBOUNCE_MS = 50

function isInboxMessagesKey(key: QueryKey, conversationId: string): boolean {
  return (
    Array.isArray(key) &&
    key[0] === 'inbox' &&
    key[1] === 'messages' &&
    key[2] === conversationId
  )
}

export function useOrgInboxRealtime(
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

    const invalidateNonMessageKeys = () => {
      const keys = keysRef.current
      if (!keys?.length) return
      for (const queryKey of keys) {
        if (!isInboxMessagesKey(queryKey, conversationId)) {
          void queryClient.invalidateQueries({ queryKey })
        }
      }
    }

    const scheduleInvalidate = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (cancelled) return
        const keys = keysRef.current
        if (keys?.length) {
          for (const queryKey of keys) {
            void queryClient.invalidateQueries({ queryKey })
          }
        }
      }, INVALIDATE_DEBOUNCE_MS)
    }

    const handlePayload = (payload: OrgInboxRealtimePayload) => {
      if (payload.message) {
        queryClient.setQueryData<OrgInboxMessage[]>(
          queryKeys.inbox.messages(conversationId),
          (current) => appendInboxMessageToCache(current, payload.message!),
        )
        invalidateNonMessageKeys()
        return
      }
      scheduleInvalidate()
    }

    void (async () => {
      try {
        const auth = await authorizeOrgInboxRealtime(conversationId)
        if (cancelled || !auth?.enabled || !auth.channel) return

        const supabase = createSupabaseBrowserClient()
        channel = supabase.channel(auth.channel)
        channel
          .on('broadcast', { event: ORG_INBOX_REALTIME_EVENT }, ({ payload }) => {
            handlePayload(payload as OrgInboxRealtimePayload)
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
