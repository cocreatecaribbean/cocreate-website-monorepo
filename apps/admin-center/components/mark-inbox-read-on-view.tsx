'use client'

import { useEffect, useRef } from 'react'
import { markInboxRead } from '@/lib/projects/inbox-unread'

type MarkInboxReadOnViewProps = {
  organizationId: string
  requestId: string
  enabled: boolean
  onMarked?: () => void
}

/** Marks portal notifications read when an admin views a request thread. */
export default function MarkInboxReadOnView({
  organizationId,
  requestId,
  enabled,
  onMarked,
}: MarkInboxReadOnViewProps) {
  const onMarkedRef = useRef(onMarked)
  onMarkedRef.current = onMarked

  useEffect(() => {
    if (!enabled || !requestId) return
    let cancelled = false
    void (async () => {
      try {
        await markInboxRead(organizationId, requestId)
        if (!cancelled) onMarkedRef.current?.()
      } catch {
        /* non-blocking */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [organizationId, requestId, enabled])

  return null
}
