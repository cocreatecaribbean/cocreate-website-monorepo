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

const EASE_IN = 'power2.in'
const EASE_OUT = 'power2.out'
const DECOR_EASE_IN = 'sine.out'

const HIDDEN_HEADING = { autoAlpha: 0, y: 20 }
const HIDDEN_COPY = { autoAlpha: 0, y: 18 }
const HIDDEN_PANEL = { autoAlpha: 0, y: 32 }
const HIDDEN_DECOR = { autoAlpha: 0 }

type UseAboutTestimonialsAnimationOptions = {
  scope: RefObject<HTMLElement | null>
}

type RevealPhase = 'hidden' | 'shown' | 'animating'

export function useAboutTestimonialsAnimation({
  scope,
}: UseAboutTestimonialsAnimationOptions) {
  const activeTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const floatTweensRef = useRef<gsap.core.Tween[]>([])
  const phaseRef = useRef<RevealPhase>('hidden')

  useGSAP(
    () => {
      const section = scope.current
      if (!section) return

      const heading = section.querySelector<HTMLElement>('[data-about-testimonials-heading]')
      const copy = section.querySelector<HTMLElement>('[data-about-testimonials-copy]')
      const panel = section.querySelector<HTMLElement>('[data-about-testimonials-panel]')
      const decor = section.querySelectorAll<HTMLElement>('[data-about-testimonials-decor]')
      const decorFloat = section.querySelectorAll<HTMLElement>(
        '[data-about-testimonials-decor-float]',
      )

      if (!heading || !panel) return

      const targets = [heading, copy, panel, ...decor].filter(Boolean) as HTMLElement[]

      const killFloat = () => {
        floatTweensRef.current.forEach((tween) => tween.kill())
        floatTweensRef.current = []
        gsap.set(decorFloat, { y: 0 })
      }

      const startDecorFloat = () => {
        killFloat()
        decorFloat.forEach((el, index) => {
          floatTweensRef.current.push(
            gsap.to(el, {
              y: index === 0 ? -36 : 36,
              duration: 4.2,
              ease: 'sine.inOut',
              yoyo: true,
              repeat: -1,
            }),
          )
        })
      }

      const applyHiddenState = () => {
        gsap.set(heading, HIDDEN_HEADING)
        if (copy) gsap.set(copy, HIDDEN_COPY)
        gsap.set(panel, HIDDEN_PANEL)
        gsap.set(decor, HIDDEN_DECOR)
      }

      const playReveal = () => {
        if (phaseRef.current === 'shown') return

        phaseRef.current = 'animating'
        activeTimelineRef.current?.kill()
        killFloat()
        applyHiddenState()

        const tl = gsap.timeline({
          defaults: { ease: EASE_OUT, overwrite: 'auto' },
          onComplete: () => {
            activeTimelineRef.current = null
            phaseRef.current = 'shown'
            startDecorFloat()
          },
          onInterrupt: () => {
            if (phaseRef.current === 'animating') phaseRef.current = 'hidden'
          },
        })

        activeTimelineRef.current = tl

        tl.to(heading, { autoAlpha: 1, y: 0, duration: 0.52 })
        if (copy) {
          tl.to(copy, { autoAlpha: 1, y: 0, duration: 0.48 }, '<0.06')
        }
        tl.to(
          panel,
          { autoAlpha: 1, y: 0, duration: 0.72 },
          copy ? '-=0.12' : '<0.1',
        ).to(
          decor,
          { autoAlpha: 1, duration: 1, ease: DECOR_EASE_IN, stagger: 0.12 },
          '-=0.35',
        )
      }

      const playHide = () => {
        if (phaseRef.current === 'hidden') return

        phaseRef.current = 'animating'
        activeTimelineRef.current?.kill()
        killFloat()

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

        tl.to(panel, { autoAlpha: 0, y: 24, duration: 0.42 })
          .to(heading, { autoAlpha: 0, y: -12, duration: 0.32 }, '-=0.2')
          .to(copy ?? [], { autoAlpha: 0, y: -10, duration: 0.28 }, '-=0.24')
          .to(decor, { autoAlpha: 0, duration: 0.3, stagger: 0.05 }, '-=0.22')
      }

      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      if (prefersReducedMotion) {
        gsap.set(targets, { clearProps: 'all', autoAlpha: 1, y: 0 })
        phaseRef.current = 'shown'
        return
      }

      primeScrollRevealTargets(heading, HIDDEN_HEADING)
      if (copy) primeScrollRevealTargets(copy, HIDDEN_COPY)
      primeScrollRevealTargets(panel, HIDDEN_PANEL)
      primeScrollRevealTargets(decor, HIDDEN_DECOR)

      const trigger = bindSectionScrollReveal({
        trigger: section,
        onReveal: playReveal,
        onHide: playHide,
        persistAfterReveal: true,
      })

      return () => {
        activeTimelineRef.current?.kill()
        killFloat()
        trigger.kill()
        gsap.killTweensOf(targets)
        phaseRef.current = 'hidden'
      }
    },
    { scope },
  )
}
