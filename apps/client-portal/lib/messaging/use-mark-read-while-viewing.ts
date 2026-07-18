'use client'

import { useEffect, useRef } from 'react'

const DEFAULT_DEBOUNCE_MS = 300

/**
 * Calls `mark` when the viewed entity id or latest message id changes
 * (open thread + live messages while viewing = read).
 */
export function useMarkReadWhileViewing(options: {
  enabled: boolean
  /** Conversation / request id */
  viewId: string | null | undefined
  /** Latest message id in the open thread (triggers re-mark on live arrivals) */
  latestMessageId: string | null | undefined
  mark: () => Promise<void>
  debounceMs?: number
}) {
  const { enabled, viewId, latestMessageId, mark, debounceMs = DEFAULT_DEBOUNCE_MS } =
    options
  const markRef = useRef(mark)
  markRef.current = mark

  useEffect(() => {
    if (!enabled || !viewId) return

    let cancelled = false
    const timer = window.setTimeout(() => {
      if (cancelled) return
      void markRef.current().catch(() => {
        /* non-blocking */
      })
    }, debounceMs)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [enabled, viewId, latestMessageId, debounceMs])
}
