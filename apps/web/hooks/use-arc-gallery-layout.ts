'use client'

import { useEffect, useState, type RefObject } from 'react'
import {
  ARC_GALLERY_LAYOUTS,
  computeArcLayout,
  type ArcGalleryLayout,
} from '@/utils/arc-gallery-math'

export function useArcGalleryLayout(
  stageRef: RefObject<HTMLElement | null>,
): ArcGalleryLayout {
  const [layout, setLayout] = useState<ArcGalleryLayout>(
    ARC_GALLERY_LAYOUTS.sm,
  )

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const update = () => {
      const width = stage.getBoundingClientRect().width
      if (width > 0) {
        setLayout(computeArcLayout(width))
      }
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(stage)

    return () => observer.disconnect()
  }, [stageRef])

  return layout
}
