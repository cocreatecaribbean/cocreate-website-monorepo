'use client'

import { useEffect } from 'react'

const HEARTBEAT_MS = 60_000

/** Keeps User.lastSeenAt fresh while Admin Center tab is visible (email digest suppression). */
export function PresenceHeartbeat() {
  useEffect(() => {
    let cancelled = false

    const beat = () => {
      if (cancelled || document.visibilityState !== 'visible') return
      void fetch('/api/presence', {
        method: 'POST',
        cache: 'no-store',
      }).catch(() => {
        /* ignore transient network errors */
      })
    }

    beat()
    const intervalId = window.setInterval(beat, HEARTBEAT_MS)
    document.addEventListener('visibilitychange', beat)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', beat)
    }
  }, [])

  return null
}
