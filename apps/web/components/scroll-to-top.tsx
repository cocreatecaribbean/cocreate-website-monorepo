'use client'

import { usePathname } from 'next/navigation'
import { useLayoutEffect, useRef } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { markSpaNavigation } from '@/lib/scroll/navigation'
import { scrollToDocumentTop } from '@/lib/scroll/scroll-to-document-top'

const SMOOTH_DURATION = 0.85

/**
 * SPA route changes: scroll to top and refresh ScrollTrigger once.
 * Does not run on first paint (reload uses ScrollSmootherWrapper restore).
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

    const resetNativeScroll = () => {
      scrollToDocumentTop()
    }

    const syncScroll = () => {
      const smoother = ScrollSmoother.get()
      if (smoother) {
        smoother.paused(false)
        const prev = smoother.smooth()
        smoother.smooth(0)
        smoother.scrollTop(0)
        smoother.smooth(prev > 0 ? prev : SMOOTH_DURATION)
        smoother.scrollTrigger?.refresh()
      } else {
        resetNativeScroll()
      }
      ScrollTrigger.refresh()
    }

    if (!ScrollSmoother.get()) {
      resetNativeScroll()
    }

    requestAnimationFrame(() => {
      syncScroll()
      if (!ScrollSmoother.get()) {
        requestAnimationFrame(resetNativeScroll)
      }
    })
  }, [pathname])

  return null
}
