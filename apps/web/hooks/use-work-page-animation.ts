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
/** Wrapper fade only — never on the rounded card; skipped on touch (iOS radius + parent opacity) */
const HIDDEN_TILE = { autoAlpha: 0 }

type UseWorkPageAnimationOptions = {
  scope: RefObject<HTMLElement | null>
}

type RevealPhase = 'hidden' | 'shown' | 'animating'

function showTilesImmediately(tiles: HTMLElement[]) {
  gsap.set(tiles, { clearProps: 'opacity,visibility', autoAlpha: 1 })
}

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

      const animateTiles = !ScrollTrigger.isTouch
      const targets = animateTiles ? [heading, ...tiles] : [heading]

      const applyHiddenState = () => {
        gsap.set(heading, HIDDEN_HEADING)
        if (animateTiles) {
          gsap.set(tiles, HIDDEN_TILE)
        } else {
          showTilesImmediately(tiles)
        }
      }

      const playReveal = () => {
        // onEnter + syncIfInView both run after refresh — ignore duplicate calls
        if (phaseRef.current !== 'hidden') return

        phaseRef.current = 'animating'
        activeTimelineRef.current?.kill()

        const tl = gsap.timeline({
          defaults: { ease: EASE_OUT, overwrite: 'auto' },
          onComplete: () => {
            activeTimelineRef.current = null
            phaseRef.current = 'shown'
            if (!animateTiles) showTilesImmediately(tiles)
          },
          onInterrupt: () => {
            if (phaseRef.current === 'animating') phaseRef.current = 'hidden'
          },
        })

        activeTimelineRef.current = tl

        if (animateTiles) {
          applyHiddenState()
          tl.to(heading, {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            onStart: () => heading.classList.remove('opacity-0'),
          }).to(
            tiles,
            {
              autoAlpha: 1,
              duration: 0.55,
              stagger: {
                each: TILE_STAGGER,
                from: 'start',
              },
            },
            '-=0.32',
          )
        } else {
          // Touch: tiles stay visible; heading is already primed hidden — never re-hide (that caused the double-load flash)
          showTilesImmediately(tiles)
          tl.to(heading, {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            onStart: () => heading.classList.remove('opacity-0'),
          })
        }
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

        if (animateTiles) {
          tl.to(tiles, {
            autoAlpha: 0,
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
        } else {
          showTilesImmediately(tiles)
          tl.to(heading, {
            autoAlpha: 0,
            y: -14,
            duration: 0.34,
          })
        }
      }

      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      if (prefersReducedMotion) {
        gsap.set(heading, { autoAlpha: 1, y: 0 })
        heading.classList.remove('opacity-0')
        showTilesImmediately(tiles)
        phaseRef.current = 'shown'
        return
      }

      primeScrollRevealTargets(heading, HIDDEN_HEADING)
      if (animateTiles) {
        primeScrollRevealTargets(tiles, HIDDEN_TILE)
      } else {
        showTilesImmediately(tiles)
      }

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
