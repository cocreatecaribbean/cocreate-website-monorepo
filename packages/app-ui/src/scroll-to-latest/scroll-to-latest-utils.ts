export const DEFAULT_NEAR_BOTTOM_THRESHOLD = 120
export const NESTED_NEAR_BOTTOM_THRESHOLD = 48
export const PIN_BOTTOM_MS = 3000

export type ScrollFollowMode = 'always' | 'near-bottom' | 'pinned'

export function isNearBottom(
  element: HTMLElement,
  threshold = DEFAULT_NEAR_BOTTOM_THRESHOLD,
): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight < threshold
}

export function itemsSignature(items: Array<{ id: string }>): string {
  return items.map((item) => item.id).join('|')
}

export function hasItemsSignatureChanged(previous: string, current: string): boolean {
  return previous !== '' && current !== previous
}

export function shouldResetScrollOnScopeChange(
  previousScopeKey: string | undefined,
  scopeKey: string | undefined,
): boolean {
  return scopeKey !== undefined && scopeKey !== previousScopeKey
}

export function resolveShouldFollowScroll(options: {
  scrollOn: ScrollFollowMode
  nearBottom: boolean
  pinBottomUntil: number
  force?: boolean
  now?: number
}): boolean {
  const { scrollOn, nearBottom, pinBottomUntil, force = false, now = Date.now() } = options
  if (force) return true
  if (scrollOn === 'always') return true
  if (now < pinBottomUntil) return true
  return nearBottom
}

export function computeScrollTopForAnchorEnd(
  container: HTMLElement,
  anchor: HTMLElement,
): number {
  const containerRect = container.getBoundingClientRect()
  const anchorRect = anchor.getBoundingClientRect()
  const anchorBottomInContainer = anchorRect.bottom - containerRect.top + container.scrollTop
  const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight)
  const targetScrollTop = anchorBottomInContainer - container.clientHeight
  return Math.min(maxScroll, Math.max(0, targetScrollTop))
}

export function scrollEndIntoView(
  container: HTMLElement | null,
  anchor: HTMLElement | null,
  behavior: ScrollBehavior = 'auto',
): void {
  if (!container) return

  const run = () => {
    const targetScrollTop =
      anchor != null
        ? computeScrollTopForAnchorEnd(container, anchor)
        : Math.max(0, container.scrollHeight - container.clientHeight)

    if (behavior === 'smooth' && typeof container.scrollTo === 'function') {
      container.scrollTo({ top: targetScrollTop, behavior: 'smooth' })
      return
    }
    container.scrollTop = targetScrollTop
  }

  requestAnimationFrame(() => {
    run()
    requestAnimationFrame(run)
  })
  setTimeout(run, 0)
}
