'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type UseCarouselDragOptions = {
  activeIndexRef: React.RefObject<number>
  itemCount: number
  spacing: number
  tileWidth: number
  stageRef?: React.RefObject<HTMLElement | null>
  onCommitIndex: (index: number) => void
  /** @deprecated Prefer link tiles; used by bento carousel only */
  onTapCenter?: () => void
}

const DRAG_START_PX = 6

function normalizeIndex(index: number, length: number) {
  return ((index % length) + length) % length
}

export function useCarouselDrag({
  activeIndexRef,
  itemCount,
  spacing,
  tileWidth,
  stageRef,
  onCommitIndex,
  onTapCenter,
}: UseCarouselDragOptions) {
  const [dragPx, setDragPx] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const didDragRef = useRef(false)
  const dragPxRef = useRef(0)
  const draggingRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)
  const startRef = useRef({ x: 0, y: 0 })
  const lastRef = useRef({ x: 0, t: 0 })
  const velocityRef = useRef(0)
  const stageRectRef = useRef<DOMRect | null>(null)
  const cancelledRef = useRef(false)

  const onCommitRef = useRef(onCommitIndex)
  const onTapCenterRef = useRef(onTapCenter)
  onCommitRef.current = onCommitIndex
  onTapCenterRef.current = onTapCenter

  const clearWindowListeners = useRef(() => {})

  const finishGesture = useCallback(() => {
    clearWindowListeners.current()
    pointerIdRef.current = null

    if (draggingRef.current) {
      // Finger right (+px) moves tiles right → lower visual index
      const progress = dragPxRef.current / spacing
      const flick = (velocityRef.current * 100) / spacing
      const touch =
        typeof window !== 'undefined' &&
        window.matchMedia('(pointer: coarse)').matches
      const flickBoost = touch ? 0.08 : 0.3
      const visualPosition =
        activeIndexRef.current - progress - flick * flickBoost
      const target = normalizeIndex(Math.round(visualPosition), itemCount)
      onCommitRef.current(target)
    } else if (!cancelledRef.current && stageRectRef.current && onTapCenterRef.current) {
      const rect = stageRectRef.current
      const relX = startRef.current.x - rect.left - rect.width / 2
      if (Math.abs(relX) <= tileWidth * 0.38) {
        onTapCenterRef.current()
      }
    }

    cancelledRef.current = false
    draggingRef.current = false
    setIsDragging(false)
    dragPxRef.current = 0
    setDragPx(0)
    velocityRef.current = 0
    stageRectRef.current = null
  }, [activeIndexRef, itemCount, spacing, tileWidth])

  useEffect(() => () => clearWindowListeners.current(), [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return

      const stage = stageRef?.current ?? e.currentTarget
      stageRectRef.current = stage.getBoundingClientRect()
      pointerIdRef.current = e.pointerId
      didDragRef.current = false
      draggingRef.current = false
      cancelledRef.current = false
      startRef.current = { x: e.clientX, y: e.clientY }
      lastRef.current = { x: e.clientX, t: performance.now() }
      velocityRef.current = 0
      dragPxRef.current = 0
      setDragPx(0)
      setIsDragging(false)

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerIdRef.current) return

        const dx = ev.clientX - startRef.current.x
        const dy = ev.clientY - startRef.current.y

        if (!draggingRef.current) {
          if (Math.abs(dx) < DRAG_START_PX && Math.abs(dy) < DRAG_START_PX) return
          if (Math.abs(dy) > Math.abs(dx) * 1.75) {
            cancelledRef.current = true
            finishGesture()
            return
          }
          draggingRef.current = true
          didDragRef.current = true
          setIsDragging(true)
        }

        ev.preventDefault()

        const now = performance.now()
        const dt = now - lastRef.current.t
        if (dt > 0) {
          velocityRef.current = (ev.clientX - lastRef.current.x) / dt
        }
        lastRef.current = { x: ev.clientX, t: now }

        const max = spacing * 1.35
        const px = Math.max(-max, Math.min(max, dx))
        dragPxRef.current = px
        setDragPx(px)
      }

      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerIdRef.current) return
        finishGesture()
      }

      clearWindowListeners.current()
      window.addEventListener('pointermove', onMove, { passive: false })
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)

      clearWindowListeners.current = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
      }
    },
    [finishGesture, spacing, stageRef],
  )

  /** Subtract from activeIndex so tiles follow the finger */
  const dragProgress = dragPx / spacing

  return { dragProgress, isDragging, onPointerDown, didDragRef }
}
