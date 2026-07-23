'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'

/** Offset from the cursor hotspot so the dot settles at the cursor's bottom-right. */
const OFFSET_X = 22
const OFFSET_Y = 28
/** Keep the centered 12px (h-3/w-3) dot fully inside the viewport. */
const EDGE_PAD = 6

/**
 * Decorative brand-yellow dot that trails the real cursor with lag.
 * Purely additive: does NOT hide or replace the native cursor icon.
 * Desktop fine-pointer only. Targets the bottom-right of the cursor
 * (not the tip), and stays clamped on-screen.
 */
export default function CursorTrailDot() {
  const dotRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setEnabled(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const dot = dotRef.current
    if (!dot) return

    gsap.set(dot, { xPercent: -50, yPercent: -50, x: 0, y: 0 })

    const moveX = gsap.quickTo(dot, 'x', { duration: 0.45, ease: 'power3' })
    const moveY = gsap.quickTo(dot, 'y', { duration: 0.45, ease: 'power3' })

    const clampTarget = (x: number, y: number) => ({
      x: Math.min(window.innerWidth - EDGE_PAD, Math.max(EDGE_PAD, x)),
      y: Math.min(window.innerHeight - EDGE_PAD, Math.max(EDGE_PAD, y)),
    })

    const onMove = (event: PointerEvent) => {
      const { x, y } = clampTarget(
        event.clientX + OFFSET_X,
        event.clientY + OFFSET_Y,
      )
      moveX(x)
      moveY(y)
      gsap.to(dot, { opacity: 1, duration: 0.2, overwrite: 'auto' })
    }

    const hide = () => {
      gsap.to(dot, { opacity: 0, duration: 0.2, overwrite: 'auto' })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', hide)
    window.addEventListener('blur', hide)

    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', hide)
      window.removeEventListener('blur', hide)
    }
  }, [enabled])

  if (!mounted || !enabled) return null

  return createPortal(
    <div
      ref={dotRef}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[9999] h-3 w-3 rounded-full bg-sanmarino opacity-0"
      style={{ willChange: 'transform' }}
    />,
    document.body,
  )
}
