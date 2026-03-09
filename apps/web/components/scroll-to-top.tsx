'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function ScrollToTop() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    // 1. Get the active smoother instance
    const smoother = ScrollSmoother.get()
    
    if (smoother) {
      // 2. Force it to 0 immediately (no animation)
      smoother.scrollTop(0)
    } else {
      // Fallback for pages where smoother might not be init yet
      window.scrollTo(0, 0)
    }

    // 3. IMPORTANT: Kill any old ScrollTriggers from the previous page
    // This prevents "ghost" triggers from firing at the wrong scroll position
    ScrollTrigger.getAll().forEach(t => t.kill())
    ScrollTrigger.refresh()

  }, [pathname])

  return null
}