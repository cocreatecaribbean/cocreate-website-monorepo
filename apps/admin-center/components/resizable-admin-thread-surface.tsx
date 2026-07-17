'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@cocreate/app-ui/cn'

const MIN_WIDTH = 320
const MIN_HEIGHT = 280
const MD_MIN_WIDTH = 768

type Size = { width: number; height: number }

type ResizableAdminThreadSurfaceProps = {
  storageKey: string
  children: ReactNode
  className?: string
  /** Default max-width utility when the card has not been resized yet */
  unsizedClassName?: string
}

function readStoredSize(key: string): Size | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Size>
    if (
      typeof parsed.width === 'number' &&
      Number.isFinite(parsed.width) &&
      typeof parsed.height === 'number' &&
      Number.isFinite(parsed.height)
    ) {
      return { width: parsed.width, height: parsed.height }
    }
  } catch {
    // ignore
  }
  return null
}

function clampSize(size: Size, maxWidth: number, maxHeight: number): Size {
  return {
    width: Math.min(maxWidth, Math.max(MIN_WIDTH, size.width)),
    height: Math.min(maxHeight, Math.max(MIN_HEIGHT, size.height)),
  }
}

function getViewportMaxHeight() {
  if (typeof window === 'undefined') return 900
  return Math.min(window.innerHeight * 0.85, 920)
}

/**
 * Desktop/tablet resize wrapper for admin conversation cards.
 * Drag the bottom-right handle to change both width and height.
 * Narrow viewports keep natural full-width layout (no resize handle).
 */
export default function ResizableAdminThreadSurface({
  storageKey,
  children,
  className,
  unsizedClassName = 'w-full max-w-2xl',
}: ResizableAdminThreadSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    startX: number
    startY: number
    startW: number
    startH: number
  } | null>(null)
  const [size, setSize] = useState<Size | null>(null)
  const [canResize, setCanResize] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MD_MIN_WIDTH}px)`)
    const sync = () => setCanResize(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!canResize) {
      setSize(null)
      return
    }
    const stored = readStoredSize(storageKey)
    if (!stored) {
      setSize(null)
      return
    }
    const parentWidth = surfaceRef.current?.parentElement?.clientWidth ?? window.innerWidth
    setSize(clampSize(stored, parentWidth, getViewportMaxHeight()))
  }, [storageKey, canResize])

  const persist = useCallback(
    (next: Size) => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        // ignore
      }
    },
    [storageKey],
  )

  const resolveMaxBounds = () => {
    const parentWidth = surfaceRef.current?.parentElement?.clientWidth ?? window.innerWidth
    return {
      maxWidth: Math.max(MIN_WIDTH, parentWidth),
      maxHeight: getViewportMaxHeight(),
    }
  }

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canResize) return
    event.preventDefault()
    const el = surfaceRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startW: rect.width,
      startH: rect.height,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const { maxWidth, maxHeight } = resolveMaxBounds()
    const next = clampSize(
      {
        width: dragRef.current.startW + (event.clientX - dragRef.current.startX),
        height: dragRef.current.startH + (event.clientY - dragRef.current.startY),
      },
      maxWidth,
      maxHeight,
    )
    setSize(next)
  }

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    dragRef.current = null
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // ignore
    }
    const el = surfaceRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const { maxWidth, maxHeight } = resolveMaxBounds()
    const next = clampSize(
      { width: rect.width, height: rect.height },
      maxWidth,
      maxHeight,
    )
    setSize(next)
    persist(next)
  }

  const sized = canResize && size != null

  return (
    <div
      ref={surfaceRef}
      className={cn(
        'relative flex min-h-0 flex-col overflow-hidden',
        sized && 'admin-thread-surface--sized',
        !sized && unsizedClassName,
        className,
      )}
      style={
        sized
          ? {
              width: size.width,
              height: size.height,
              maxWidth: '100%',
            }
          : undefined
      }
    >
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      {canResize ? (
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize conversation panel"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="absolute bottom-0 right-0 z-20 flex h-5 w-5 cursor-nwse-resize touch-none items-end justify-end p-0.5"
        >
          <span
            className="pointer-events-none h-2.5 w-2.5 rounded-[1px] border-r-2 border-b-2 border-current opacity-35"
            aria-hidden
          />
        </div>
      ) : null}
    </div>
  )
}
