/** True when the app uses document scroll (touch / reduced motion) instead of ScrollSmoother.
 * Phones: `(pointer: coarse)`. Do not key off maxTouchPoints — Windows Precision
 * Touchpads often report touch points while remaining pointer:fine (isTouch === 2).
 */
export function prefersNativeScroll() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
