'use client'

import { useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import {
  bindSectionScrollReveal,
  primeScrollRevealTargets,
} from '@/lib/scroll/section-scroll-reveal'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const EASE_OUT = 'power2.out'
const EASE_IN = 'power2.in'
const REVEAL_DURATION = 0.58
const HIDE_DURATION = 0.48
const SLIDE_OFFSET = 24

/** Opacity-only hidden state — visibility stays visible so flex gap is never affected. */
const hiddenState = { opacity: 0, y: SLIDE_OFFSET }
const shownState = { opacity: 1, y: 0 }

type SectionRevealProps = {
  children: ReactNode
  revealKey: string
  /** After reveal, stay visible while scrolling past; hide only when scrolling back above. */
  persistAfterReveal?: boolean
}

type RevealPhase = 'hidden' | 'shown' | 'animating'

export default function SectionReveal({
  children,
  revealKey,
  persistAfterReveal = false,
}: SectionRevealProps) {
  /** ScrollTrigger anchor — never animated, preserves layout spacing. */
  const triggerRef = useRef<HTMLDivElement>(null)
  /** Inner target for fade + slide. */
  const contentRef = useRef<HTMLDivElement>(null)
  const activeTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const phaseRef = useRef<RevealPhase>('hidden')

  useGSAP(
    () => {
      const trigger = triggerRef.current
      const content = contentRef.current
      if (!trigger || !content) return

      phaseRef.current = 'hidden'

      const showImmediately = () => {
        activeTimelineRef.current?.kill()
        gsap.set(content, { ...shownState, clearProps: 'transform' })
        phaseRef.current = 'shown'
      }

      const applyHiddenState = () => {
        gsap.set(content, { ...hiddenState, visibility: 'visible' })
      }

      const playReveal = () => {
        if (phaseRef.current === 'shown') return

        activeTimelineRef.current?.kill()

        if ((gsap.getProperty(content, 'opacity') as number) < 0.01) {
          applyHiddenState()
        }

        phaseRef.current = 'animating'

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

        activeTimelineRef.current.to(content, {
          ...shownState,
          duration: REVEAL_DURATION,
        })
      }

      const hideSection = () => {
        if (phaseRef.current === 'hidden') return

        activeTimelineRef.current?.kill()
        phaseRef.current = 'animating'

        activeTimelineRef.current = gsap.timeline({
          defaults: { ease: EASE_IN, overwrite: 'auto' },
          onComplete: () => {
            activeTimelineRef.current = null
            phaseRef.current = 'hidden'
            applyHiddenState()
          },
          onInterrupt: () => {
            if (phaseRef.current === 'animating') phaseRef.current = 'shown'
          },
        })

        activeTimelineRef.current.to(content, {
          ...hiddenState,
          duration: HIDE_DURATION,
        })
      }

      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      if (prefersReducedMotion) {
        showImmediately()
        return
      }

      primeScrollRevealTargets(content, hiddenState)

      const st = bindSectionScrollReveal({
        trigger,
        onReveal: playReveal,
        onHide: hideSection,
        persistAfterReveal,
      })

      const fallback = gsap.delayedCall(0.65, () => {
        if (phaseRef.current !== 'shown' && st.isActive) {
          showImmediately()
        }
      })

      return () => {
        fallback.kill()
        activeTimelineRef.current?.kill()
        st.kill()
        gsap.killTweensOf(content)
        phaseRef.current = 'hidden'
      }
    },
    { scope: triggerRef, dependencies: [revealKey, persistAfterReveal] },
  )

  return (
    <div ref={triggerRef} className="w-full">
      <div ref={contentRef} className="w-full">
        {children}
      </div>
    </div>
  )
}
