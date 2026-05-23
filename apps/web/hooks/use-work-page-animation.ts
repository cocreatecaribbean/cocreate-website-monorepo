'use client'

import { useRef, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import {
  bindSectionScrollReveal,
  primeScrollRevealTargets,
} from '@/lib/scroll/section-scroll-reveal'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const EASE_OUT = 'power2.out'
const HIDDEN_HEADING = { autoAlpha: 0, y: 24 }

type UseWorkPageAnimationOptions = {
  scope: RefObject<HTMLElement | null>
  /** Re-run when filter or route identity changes (client nav). */
  revealKey: string
}

type RevealPhase = 'hidden' | 'shown' | 'animating'

export function useWorkPageAnimation({
  scope,
  revealKey,
}: UseWorkPageAnimationOptions) {
  const activeTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const phaseRef = useRef<RevealPhase>('hidden')

  useGSAP(
    () => {
      const section = scope.current
      if (!section) return

      const heading = section.querySelector<HTMLElement>('[data-work-page-heading]')
      if (!heading) return

      phaseRef.current = 'hidden'

      const showHeadingImmediately = () => {
        activeTimelineRef.current?.kill()
        gsap.set(heading, { autoAlpha: 1, y: 0, clearProps: 'transform' })
        heading.classList.remove('opacity-0')
        phaseRef.current = 'shown'
      }

      const playReveal = () => {
        if (phaseRef.current === 'shown' || phaseRef.current === 'animating') return

        phaseRef.current = 'animating'
        activeTimelineRef.current?.kill()
        gsap.set(heading, HIDDEN_HEADING)

        activeTimelineRef.current = gsap.timeline({
          defaults: { ease: EASE_OUT, overwrite: 'auto' },
          onComplete: () => {
            activeTimelineRef.current = null
            phaseRef.current = 'shown'
          },
          onInterrupt: () => {
            if (phaseRef.current === 'animating') phaseRef.current = 'hidden'
          },
        })

        activeTimelineRef.current.to(heading, {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          onStart: () => heading.classList.remove('opacity-0'),
        })
      }

      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      if (prefersReducedMotion) {
        showHeadingImmediately()
        return
      }

      primeScrollRevealTargets(heading, HIDDEN_HEADING)

      const trigger = bindSectionScrollReveal({
        trigger: section,
        onReveal: playReveal,
        onHide: () => {
          /* Keep title visible once on page — hiding on leave breaks client nav. */
        },
      })

      const ensureVisible = () => {
        ScrollTrigger.refresh(true)
        if (trigger.isActive) {
          playReveal()
        } else {
          showHeadingImmediately()
        }
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(ensureVisible)
      })

      const fallback = gsap.delayedCall(0.65, () => {
        if (phaseRef.current !== 'shown') {
          showHeadingImmediately()
        }
      })

      return () => {
        fallback.kill()
        activeTimelineRef.current?.kill()
        trigger.kill()
        gsap.killTweensOf(heading)
        phaseRef.current = 'hidden'
      }
    },
    { scope, dependencies: [revealKey] },
  )
}
