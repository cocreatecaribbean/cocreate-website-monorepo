import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { scrollToDocumentTop } from '@/lib/scroll/scroll-to-document-top'

const SMOOTH_DURATION = 0.85

/**
 * Instantly jump scroll to top (ScrollSmoother or native).
 * Must run in useLayoutEffect before page ScrollTriggers are created,
 * otherwise SPA nav inherits the previous page's scroll progress.
 */
export function resetRouteScrollToTop() {
  if (typeof window === 'undefined') return

  const smoother = ScrollSmoother.get()
  if (smoother) {
    smoother.paused(false)
    const prev = smoother.smooth()
    smoother.smooth(0)
    smoother.scrollTop(0)
    smoother.smooth(prev > 0 ? prev : SMOOTH_DURATION)
  }

  scrollToDocumentTop()
}
