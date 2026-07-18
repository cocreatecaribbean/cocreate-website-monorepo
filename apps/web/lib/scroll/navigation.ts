/** Set during render when pathname changes (client navigation, not reload). */
let spaNavigationPending = false
/** Keep the flag readable across Strict Mode double-mount in the same tick. */
let spaNavigationClearTimer: ReturnType<typeof setTimeout> | null = null

export function markSpaNavigation() {
  spaNavigationPending = true
  if (spaNavigationClearTimer != null) {
    clearTimeout(spaNavigationClearTimer)
    spaNavigationClearTimer = null
  }
}

/**
 * Returns whether this mount is from a client-side route change.
 * Does not clear immediately so React Strict Mode remounts still see the flag.
 */
export function consumeSpaNavigation(): boolean {
  const pending = spaNavigationPending
  if (pending && spaNavigationClearTimer == null) {
    spaNavigationClearTimer = setTimeout(() => {
      spaNavigationPending = false
      spaNavigationClearTimer = null
    }, 0)
  }
  return pending
}
