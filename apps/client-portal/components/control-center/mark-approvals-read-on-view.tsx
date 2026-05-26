'use client'

import { useEffect } from 'react'
import { dispatchPortalNotificationsRefresh, markApprovalsRead } from '@/lib/projects/fetch-projects-client'

type MarkApprovalsReadOnViewProps = {
  requestId: string
  enabled: boolean
}

/** Marks checkpoint approval notifications read when a client views a request thread. */
export default function MarkApprovalsReadOnView({
  requestId,
  enabled,
}: MarkApprovalsReadOnViewProps) {
  useEffect(() => {
    if (!enabled || !requestId) return
    let cancelled = false
    void (async () => {
      try {
        await markApprovalsRead(requestId)
        if (!cancelled) {
          dispatchPortalNotificationsRefresh()
        }
      } catch {
        /* non-blocking */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [requestId, enabled])

  return null
}
