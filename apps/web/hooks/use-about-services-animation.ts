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

const ITEM_STAGGER = 0.1
const ITEM_HIDE_STAGGER = 0.06
const EASE_IN = 'power2.in'
const EASE_OUT = 'power2.out'
const DECOR_EASE_IN = 'sine.out'

const HIDDEN_HEADING = { autoAlpha: 0, y: 20 }
const HIDDEN_PANEL = { autoAlpha: 0, y: 28 }
const HIDDEN_DECOR = { autoAlpha: 0 }
const HIDDEN_ITEM = { autoAlpha: 0, y: 20 }

type UseAboutServicesAnimationOptions = {
  scope: RefObject<HTMLElement | null>
}

type RevealPhase = 'hidden' | 'shown' | 'animating'

export function useAboutServicesAnimation({ scope }: UseAboutServicesAnimationOptions) {
  const activeTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const floatTweensRef = useRef<gsap.core.Tween[]>([])
  const phaseRef = useRef<RevealPhase>('hidden')

  useGSAP(
    () => {
      const section = scope.current
      if (!section) return

      const heading = section.querySelector<HTMLElement>('[data-about-services-heading]')
      const panel = section.querySelector<HTMLElement>('[data-about-services-panel]')
      const decor = section.querySelectorAll<HTMLElement>('[data-about-services-decor]')
      const decorFloat = section.querySelectorAll<HTMLElement>(
        '[data-about-services-decor-float]',
      )
      const items = gsap.utils.toArray<HTMLElement>('[data-about-services-item]', section)

      if (!heading || !panel || items.length === 0) return

      const targets = [heading, panel, ...decor, ...items]

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
              y: index === 0 ? -44 : 44,
              duration: 3.8,
              ease: 'sine.inOut',
              yoyo: true,
              repeat: -1,
            }),
          )
        })
      }

      const applyHiddenState = () => {
        gsap.set(heading, HIDDEN_HEADING)
        gsap.set(panel, HIDDEN_PANEL)
        gsap.set(decor, HIDDEN_DECOR)
        gsap.set(items, HIDDEN_ITEM)
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

        tl.to(heading, {
          autoAlpha: 1,
          y: 0,
          duration: 0.52,
        })
          .to(
            panel,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.58,
            },
            '<0.08',
          )
          .to(
            items,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.56,
              stagger: {
                each: ITEM_STAGGER,
                from: 'start',
              },
            },
            '-=0.28',
          )
          .to(
            decor,
            {
              autoAlpha: 1,
              duration: 1.05,
              ease: DECOR_EASE_IN,
              stagger: 0.14,
            },
            '<0.12',
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

        tl.to(items, {
          autoAlpha: 0,
          y: -14,
          duration: 0.4,
          stagger: {
            each: ITEM_HIDE_STAGGER,
            from: 'end',
          },
        })
          .to(
            heading,
            {
              autoAlpha: 0,
              y: -12,
              duration: 0.32,
            },
            '-=0.18',
          )
          .to(
            decor,
            {
              autoAlpha: 0,
              duration: 0.34,
              stagger: 0.05,
            },
            '-=0.22',
          )
          .to(
            panel,
            {
              autoAlpha: 0,
              y: 24,
              duration: 0.44,
            },
            '-=0.26',
          )
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
      primeScrollRevealTargets(panel, HIDDEN_PANEL)
      primeScrollRevealTargets(decor, HIDDEN_DECOR)
      primeScrollRevealTargets(items, HIDDEN_ITEM)

      const trigger = bindSectionScrollReveal({
        trigger: section,
        onReveal: playReveal,
        onHide: playHide,
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
