'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { ScrollSmoother } from 'gsap/ScrollSmoother'

export default function ScrollToTop() {
  const pathname = usePathname()
  const lastPathname = useRef(pathname)

  useEffect(() => {
    // If the path has changed, we are on a NEW page
    if (lastPathname.current !== pathname) {
      lastPathname.current = pathname

      // Small timeout ensures the DOM has rendered and Smoother is ready
      setTimeout(() => {
        const smoother = ScrollSmoother.get()
        if (smoother) {
          smoother.scrollTop(0)
          smoother.paused(false) // Just in case it was paused during transition
        } else {
          window.scrollTo(0, 0)
        }
      }, 50) 
    }
  }, [pathname])

  return null
}