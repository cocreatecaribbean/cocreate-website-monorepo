'use client'

import { useEffect, useState, type RefObject } from 'react'
import {
  CAROUSEL_LAYOUTS,
  computeCarouselLayout,
  type CarouselLayout,
} from '@/utils/carousel-cylinder-math'

export function useCarouselLayout(
  stageRef: RefObject<HTMLElement | null>,
): CarouselLayout {
  const [layout, setLayout] = useState<CarouselLayout>(CAROUSEL_LAYOUTS.sm)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const update = () => {
      const width = stage.getBoundingClientRect().width
      if (width > 0) {
        setLayout(computeCarouselLayout(width))
      }
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(stage)

    return () => observer.disconnect()
  }, [stageRef])

  return layout
}
