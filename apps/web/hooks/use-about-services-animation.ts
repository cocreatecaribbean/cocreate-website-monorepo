'use client'

import { useRef, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/** Left-to-right, top-to-bottom — matches DOM order in the grid */
const ITEM_STAGGER = 0.1
const EASE_OUT = 'power2.out'
const DECOR_EASE_IN = 'sine.out'

const HIDDEN_HEADING = { autoAlpha: 0, y: 20 }
const HIDDEN_PANEL = { autoAlpha: 0, y: 28 }
const HIDDEN_DECOR = { autoAlpha: 0 }
const HIDDEN_ITEM = { autoAlpha: 0, y: 20 }

type UseAboutServicesAnimationOptions = {
  scope: RefObject<HTMLElement | null>
}

export function useAboutServicesAnimation({ scope }: UseAboutServicesAnimationOptions) {
  const activeTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const floatTweensRef = useRef<gsap.core.Tween[]>([])
  const isRevealedRef = useRef(false)
  const isAnimatingRef = useRef(false)

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
        if (isAnimatingRef.current || isRevealedRef.current) return

        isAnimatingRef.current = true
        activeTimelineRef.current?.kill()
        killFloat()

        // Snap to hidden start without a separate hide flash when re-entering
        applyHiddenState()

        const tl = gsap.timeline({
          defaults: { ease: EASE_OUT, overwrite: 'auto' },
          onComplete: () => {
            activeTimelineRef.current = null
            isAnimatingRef.current = false
            isRevealedRef.current = true
            startDecorFloat()
          },
          onInterrupt: () => {
            isAnimatingRef.current = false
          },
        })

        activeTimelineRef.current = tl

        tl.to(heading, {
          autoAlpha: 1,
          y: 0,
          duration: 0.52,
        }).to(panel, {
          autoAlpha: 1,
          y: 0,
          duration: 0.58,
        }, '<0.08')
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

      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      if (prefersReducedMotion) {
        gsap.set(targets, { clearProps: 'all', autoAlpha: 1, y: 0 })
        panel.style.visibility = 'visible'
        isRevealedRef.current = true
        return
      }

      applyHiddenState()
      heading.style.visibility = 'visible'
      panel.style.visibility = 'visible'

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top 82%',
        once: true,
        onEnter: playReveal,
      })

      if (trigger.isActive) {
        playReveal()
      }

      return () => {
        activeTimelineRef.current?.kill()
        killFloat()
        trigger.kill()
        gsap.killTweensOf(targets)
        isRevealedRef.current = false
        isAnimatingRef.current = false
      }
    },
    { scope },
  )
}
