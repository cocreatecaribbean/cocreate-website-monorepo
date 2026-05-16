'use client'

import gsap from 'gsap'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

/**
 * About route only — lighter scroll on tablet/phone so ScrollSmoother
 * does not fight touch scrolling.
 */
export default function AboutScrollTune() {
  useGSAP(() => {
    const smoother = ScrollSmoother.get()
    if (!smoother) return

    const mm = gsap.matchMedia()

    mm.add('(max-width: 1499px)', () => {
      const previousSmooth = smoother.smooth()
      smoother.smooth(0.15)

      if (!ScrollTrigger.isTouch) {
        ScrollTrigger.normalizeScroll(true)
      }

      return () => {
        smoother.smooth(previousSmooth)
        ScrollTrigger.normalizeScroll(false)
      }
    })

    return () => mm.revert()
  })

  return null
}
