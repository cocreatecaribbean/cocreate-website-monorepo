'use client'

import { useRef, type RefObject } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

const EASE_OUT = 'power2.out'
const HIDDEN_HEADING = { autoAlpha: 0, y: 24 }
/** Match pageTransition / animate-fadein so the heading does not fight the page fade. */
export const PAGE_TITLE_FADE_MS = 500

const HEADING_SELECTOR = '[data-page-heading]'

type UsePageTitleRevealOptions = {
  scope: RefObject<HTMLElement | null>
  /** Re-run when route/filter identity changes. */
  revealKey?: string
}

type RevealPhase = 'hidden' | 'shown' | 'animating'

/**
 * Page H1 reveal after the shared page fade-in (Work / About / Originals).
 * No ScrollTrigger — titles are above the fold.
 */
export function usePageTitleReveal({
  scope,
  revealKey = 'default',
}: UsePageTitleRevealOptions) {
  const activeTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const phaseRef = useRef<RevealPhase>('hidden')

  useGSAP(
    () => {
      const section = scope.current
      if (!section) return

      const heading = section.querySelector<HTMLElement>(HEADING_SELECTOR)
      if (!heading) return

      phaseRef.current = 'hidden'
      activeTimelineRef.current?.kill()

      const showHeadingImmediately = () => {
        activeTimelineRef.current?.kill()
        activeTimelineRef.current = null
        heading.classList.remove('opacity-0')
        gsap.set(heading, { autoAlpha: 1, y: 0, clearProps: 'transform' })
        phaseRef.current = 'shown'
      }

      const playReveal = () => {
        if (phaseRef.current === 'shown' || phaseRef.current === 'animating') return

        phaseRef.current = 'animating'
        activeTimelineRef.current?.kill()
        heading.classList.remove('opacity-0')
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
        })
      }

      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      if (prefersReducedMotion) {
        showHeadingImmediately()
        return
      }

      heading.classList.remove('opacity-0')
      gsap.set(heading, { ...HIDDEN_HEADING, visibility: 'visible' })

      const fadeHost = section.closest('.animate-fadein, .animate-fadeout')
      const hostOpacity = fadeHost
        ? Number.parseFloat(getComputedStyle(fadeHost).opacity || '1')
        : 1
      const delayS = hostOpacity < 0.95 ? PAGE_TITLE_FADE_MS / 1000 : 0

      const revealCall = gsap.delayedCall(delayS, playReveal)

      const fallback = gsap.delayedCall(delayS + 0.75, () => {
        if (phaseRef.current === 'hidden') {
          showHeadingImmediately()
        }
      })

      return () => {
        revealCall.kill()
        fallback.kill()
        activeTimelineRef.current?.kill()
        activeTimelineRef.current = null
        gsap.killTweensOf(heading)
        phaseRef.current = 'hidden'
      }
    },
    { scope, dependencies: [revealKey] },
  )
}
