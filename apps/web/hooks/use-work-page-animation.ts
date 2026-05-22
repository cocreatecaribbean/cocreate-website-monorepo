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

const TILE_STAGGER = 0.09
const TILE_HIDE_STAGGER = 0.05
const EASE_IN = 'power2.in'
const EASE_OUT = 'power2.out'

const HIDDEN_HEADING = { autoAlpha: 0, y: 24 }
const HIDDEN_TILE = { autoAlpha: 0, y: 28 }

type UseWorkPageAnimationOptions = {
  scope: RefObject<HTMLElement | null>
}

type RevealPhase = 'hidden' | 'shown' | 'animating'

export function useWorkPageAnimation({ scope }: UseWorkPageAnimationOptions) {
  const activeTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const phaseRef = useRef<RevealPhase>('hidden')

  useGSAP(
    () => {
      const section = scope.current
      if (!section) return

      const heading = section.querySelector<HTMLElement>('[data-work-page-heading]')
      const tiles = gsap.utils.toArray<HTMLElement>('[data-work-tile]', section)

      if (!heading || tiles.length === 0) return

      const targets = [heading, ...tiles]

      const applyHiddenState = () => {
        gsap.set(heading, HIDDEN_HEADING)
        gsap.set(tiles, HIDDEN_TILE)
      }

      const playReveal = () => {
        if (phaseRef.current === 'shown') return

        phaseRef.current = 'animating'
        activeTimelineRef.current?.kill()
        applyHiddenState()

        const tl = gsap.timeline({
          defaults: { ease: EASE_OUT, overwrite: 'auto' },
          onComplete: () => {
            activeTimelineRef.current = null
            phaseRef.current = 'shown'
            gsap.set(tiles, { clearProps: 'transform' })
          },
          onInterrupt: () => {
            if (phaseRef.current === 'animating') phaseRef.current = 'hidden'
          },
        })

        activeTimelineRef.current = tl

        tl.to(heading, {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
        }).to(
          tiles,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            stagger: {
              each: TILE_STAGGER,
              from: 'start',
            },
          },
          '-=0.32',
        )
      }

      const playHide = () => {
        if (phaseRef.current === 'hidden') return

        phaseRef.current = 'animating'
        activeTimelineRef.current?.kill()

        const tl = gsap.timeline({
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

        activeTimelineRef.current = tl

        tl.to(tiles, {
          autoAlpha: 0,
          y: -16,
          duration: 0.38,
          stagger: {
            each: TILE_HIDE_STAGGER,
            from: 'end',
          },
        }).to(
          heading,
          {
            autoAlpha: 0,
            y: -14,
            duration: 0.34,
          },
          '-=0.2',
        )
      }

      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      if (prefersReducedMotion) {
        gsap.set(targets, { clearProps: 'all', autoAlpha: 1, y: 0 })
        gsap.set(tiles, { clearProps: 'transform' })
        phaseRef.current = 'shown'
        return
      }

      primeScrollRevealTargets(heading, HIDDEN_HEADING)
      primeScrollRevealTargets(tiles, HIDDEN_TILE)

      const trigger = bindSectionScrollReveal({
        trigger: section,
        onReveal: playReveal,
        onHide: playHide,
      })

      return () => {
        activeTimelineRef.current?.kill()
        trigger.kill()
        gsap.killTweensOf(targets)
        phaseRef.current = 'hidden'
      }
    },
    { scope },
  )
}
