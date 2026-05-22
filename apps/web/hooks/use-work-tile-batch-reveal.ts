'use client'

import { type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const TILE_STAGGER = 0.09
const HIDDEN_TILE = { autoAlpha: 0 }

type UseWorkTileBatchRevealOptions = {
  scope: RefObject<HTMLElement | null>
  visibleCount: number
}

function markTilesReady(tiles: HTMLElement[]) {
  tiles.forEach((tile) => tile.setAttribute('data-work-tile-ready', 'true'))
}

export function useWorkTileBatchReveal({
  scope,
  visibleCount,
}: UseWorkTileBatchRevealOptions) {
  useGSAP(
    () => {
      const root = scope.current
      if (!root) return

      const pending = gsap.utils.toArray<HTMLElement>(
        '[data-work-tile]:not([data-work-tile-ready])',
        root,
      )
      if (pending.length === 0) return

      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      if (prefersReducedMotion || ScrollTrigger.isTouch) {
        gsap.set(pending, { autoAlpha: 1 })
        markTilesReady(pending)
        return
      }

      gsap.set(pending, HIDDEN_TILE)
      gsap.to(pending, {
        autoAlpha: 1,
        duration: 0.55,
        stagger: { each: TILE_STAGGER, from: 'start' },
        ease: 'power2.out',
        overwrite: 'auto',
        onComplete: () => markTilesReady(pending),
      })
    },
    { scope, dependencies: [visibleCount] },
  )
}
