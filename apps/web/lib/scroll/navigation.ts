/** Set during render when pathname changes (client navigation, not reload). */
let spaNavigationPending = false

export function markSpaNavigation() {
  spaNavigationPending = true
}

export function consumeSpaNavigation(): boolean {
  const pending = spaNavigationPending
  spaNavigationPending = false
  return pending
}
