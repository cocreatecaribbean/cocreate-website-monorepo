'use client'

import { useLayoutEffect, useState, type RefObject } from 'react'
import {
  ARC_GALLERY_LAYOUTS,
  computeArcLayout,
  type ArcGalleryLayout,
} from '@/utils/arc-gallery-math'

function measureLayout(stage: HTMLElement): ArcGalleryLayout {
  const width = stage.getBoundingClientRect().width
  if (width > 0) {
    return computeArcLayout(width)
  }
  if (typeof window !== 'undefined') {
    return computeArcLayout(window.innerWidth)
  }
  return ARC_GALLERY_LAYOUTS.sm
}

export function useArcGalleryLayout(
  stageRef: RefObject<HTMLElement | null>,
): ArcGalleryLayout {
  const [layout, setLayout] = useState<ArcGalleryLayout>(ARC_GALLERY_LAYOUTS.sm)

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    setLayout(measureLayout(stage))

    const observer = new ResizeObserver(() => {
      setLayout(measureLayout(stage))
    })
    observer.observe(stage)

    return () => observer.disconnect()
  }, [stageRef])

  return layout
}
