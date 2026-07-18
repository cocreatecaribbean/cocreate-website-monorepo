'use client'

import { usePathname } from 'next/navigation'
import { useLayoutEffect, useRef } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { markSpaNavigation } from '@/lib/scroll/navigation'
import { resetRouteScrollToTop } from '@/lib/scroll/reset-route-scroll'

/**
 * SPA route changes: scroll to top synchronously, then refresh ScrollTrigger.
 * Mounted before page content so layout effects run before page animations.
 */
export default function ScrollToTop() {
  const pathname = usePathname()
  const previousPath = useRef(pathname)

  if (previousPath.current !== pathname) {
    markSpaNavigation()
  }

  useLayoutEffect(() => {
    if (previousPath.current === pathname) return

    previousPath.current = pathname

    sessionStorage.removeItem('lastScrollY')
    sessionStorage.removeItem('lastPath')

    // Synchronous — deferred rAF left home hero ScrollTriggers scrubbed to the
    // previous page's scroll (e.g. contact → home looked mid-animation).
    resetRouteScrollToTop()
    ScrollTrigger.refresh()

    requestAnimationFrame(() => {
      resetRouteScrollToTop()
      const smoother = ScrollSmoother.get()
      smoother?.scrollTrigger?.refresh()
      ScrollTrigger.refresh()
    })
  }, [pathname])

  return null
}
