/** True when the app uses document scroll (touch / reduced motion) instead of ScrollSmoother. */
export function prefersNativeScroll() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
