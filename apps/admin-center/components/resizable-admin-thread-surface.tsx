'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@cocreate/app-ui/cn'

const MIN_WIDTH = 320
const MIN_HEIGHT = 280
const MD_MIN_WIDTH = 768
const FAB_CLEARANCE = 80
const EDGE_PADDING = 8
const HARD_MAX_HEIGHT = 920

type Size = { width: number; height: number }
type Offset = { offsetX: number; offsetY: number }
type Layout = Size & Offset

type ResizableAdminThreadSurfaceProps = {
  storageKey: string
  children: ReactNode
  className?: string
  /** Default max-width utility when the card has not been resized yet */
  unsizedClassName?: string
}

function readStoredLayout(key: string): Layout | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Layout>
    if (
      typeof parsed.width !== 'number' ||
      !Number.isFinite(parsed.width) ||
      typeof parsed.height !== 'number' ||
      !Number.isFinite(parsed.height)
    ) {
      return null
    }
    return {
      width: parsed.width,
      height: parsed.height,
      offsetX:
        typeof parsed.offsetX === 'number' && Number.isFinite(parsed.offsetX)
          ? parsed.offsetX
          : 0,
      offsetY:
        typeof parsed.offsetY === 'number' && Number.isFinite(parsed.offsetY)
          ? parsed.offsetY
          : 0,
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

function clampOffset(
  offset: Offset,
  size: Size,
  maxWidth: number,
  maxHeight: number,
): Offset {
  const maxOffsetX = Math.max(0, maxWidth - size.width)
  const maxOffsetY = Math.max(0, maxHeight - size.height)
  // Allow slight negative X so the panel can clear the right-side FAB.
  const minOffsetX = -Math.min(FAB_CLEARANCE, maxOffsetX + FAB_CLEARANCE)

  return {
    offsetX: Math.min(maxOffsetX, Math.max(minOffsetX, offset.offsetX)),
    offsetY: Math.min(maxOffsetY, Math.max(-EDGE_PADDING, offset.offsetY)),
  }
}

function clampLayout(
  layout: Layout,
  maxWidth: number,
  maxHeight: number,
): Layout {
  const size = clampSize(layout, maxWidth, maxHeight)
  const offset = clampOffset(layout, size, maxWidth, maxHeight)
  return { ...size, ...offset }
}

/**
 * Desktop/tablet resize + drag wrapper for admin conversation cards.
 * Drag the top grip to reposition; drag the bottom-right handle to resize.
 * Narrow viewports keep natural full-width layout (no resize/drag chrome).
 */
export default function ResizableAdminThreadSurface({
  storageKey,
  children,
  className,
  unsizedClassName = 'w-full max-w-2xl',
}: ResizableAdminThreadSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const layoutRef = useRef<Layout | null>(null)
  const resizeDragRef = useRef<{
    startX: number
    startY: number
    startW: number
    startH: number
    startOffsetX: number
    startOffsetY: number
  } | null>(null)
  const moveDragRef = useRef<{
    startX: number
    startY: number
    startOffsetX: number
    startOffsetY: number
  } | null>(null)
  const [layout, setLayout] = useState<Layout | null>(null)
  const [canResize, setCanResize] = useState(false)
  const [isMoving, setIsMoving] = useState(false)

  useEffect(() => {
    layoutRef.current = layout
  }, [layout])

  const resolveMaxBounds = useCallback((currentOffsetY = 0) => {
    const el = surfaceRef.current
    const parentWidth = el?.parentElement?.clientWidth ?? window.innerWidth
    const rect = el?.getBoundingClientRect()
    // Use layout top without current translate so max height stays stable while dragging.
    const visualTop = rect?.top ?? 0
    const naturalTop = visualTop - currentOffsetY
    const maxHeight = Math.max(
      MIN_HEIGHT,
      Math.min(
        HARD_MAX_HEIGHT,
        Math.floor(window.innerHeight - naturalTop - FAB_CLEARANCE),
      ),
    )
    return {
      maxWidth: Math.max(MIN_WIDTH, parentWidth - EDGE_PADDING),
      maxHeight,
    }
  }, [])

  const persist = useCallback(
    (next: Layout) => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        // ignore
      }
    },
    [storageKey],
  )

  const reclampToViewport = useCallback(() => {
    setLayout((current) => {
      if (!current) return current
      const { maxWidth, maxHeight } = resolveMaxBounds(current.offsetY)
      const next = clampLayout(current, maxWidth, maxHeight)
      if (
        next.width === current.width &&
        next.height === current.height &&
        next.offsetX === current.offsetX &&
        next.offsetY === current.offsetY
      ) {
        return current
      }
      persist(next)
      return next
    })
  }, [persist, resolveMaxBounds])

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MD_MIN_WIDTH}px)`)
    const sync = () => setCanResize(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!canResize) {
      setLayout(null)
      return
    }
    const stored = readStoredLayout(storageKey)
    if (!stored) {
      setLayout(null)
      return
    }
    // Defer one frame so getBoundingClientRect reflects laid-out position.
    // Offset is not applied yet, so pass 0 for natural top.
    const frame = requestAnimationFrame(() => {
      const { maxWidth, maxHeight } = resolveMaxBounds(0)
      const next = clampLayout(stored, maxWidth, maxHeight)
      setLayout(next)
      persist(next)
    })
    return () => cancelAnimationFrame(frame)
  }, [storageKey, canResize, persist, resolveMaxBounds])

  useEffect(() => {
    if (!canResize || layout == null) return
    const onResize = () => reclampToViewport()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [canResize, layout, reclampToViewport])

  const onResizePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canResize || !layout) return
    event.preventDefault()
    event.stopPropagation()
    const el = surfaceRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    resizeDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startW: rect.width,
      startH: rect.height,
      startOffsetX: layout.offsetX,
      startOffsetY: layout.offsetY,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onResizePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeDragRef.current) return
    const start = resizeDragRef.current
    const { maxWidth, maxHeight } = resolveMaxBounds(start.startOffsetY)
    const nextSize = clampSize(
      {
        width: start.startW + (event.clientX - start.startX),
        height: start.startH + (event.clientY - start.startY),
      },
      maxWidth,
      maxHeight,
    )
    const next = clampLayout(
      {
        ...nextSize,
        offsetX: start.startOffsetX,
        offsetY: start.startOffsetY,
      },
      maxWidth,
      maxHeight,
    )
    setLayout(next)
  }

  const onResizePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeDragRef.current) return
    resizeDragRef.current = null
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // ignore
    }
    const current = layoutRef.current
    const el = surfaceRef.current
    if (!el || !current) return
    const rect = el.getBoundingClientRect()
    const { maxWidth, maxHeight } = resolveMaxBounds(current.offsetY)
    const next = clampLayout(
      {
        width: rect.width,
        height: rect.height,
        offsetX: current.offsetX,
        offsetY: current.offsetY,
      },
      maxWidth,
      maxHeight,
    )
    setLayout(next)
    persist(next)
  }

  const onMovePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canResize || !layout) return
    event.preventDefault()
    moveDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: layout.offsetX,
      startOffsetY: layout.offsetY,
    }
    setIsMoving(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onMovePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = layoutRef.current
    if (!moveDragRef.current || !current) return
    const start = moveDragRef.current
    const { maxWidth, maxHeight } = resolveMaxBounds(start.startOffsetY)
    const next = clampLayout(
      {
        width: current.width,
        height: current.height,
        offsetX: start.startOffsetX + (event.clientX - start.startX),
        offsetY: start.startOffsetY + (event.clientY - start.startY),
      },
      maxWidth,
      maxHeight,
    )
    setLayout(next)
  }

  const onMovePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!moveDragRef.current) return
    moveDragRef.current = null
    setIsMoving(false)
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // ignore
    }
    setLayout((current) => {
      if (!current) return current
      const { maxWidth, maxHeight } = resolveMaxBounds(current.offsetY)
      const next = clampLayout(current, maxWidth, maxHeight)
      persist(next)
      return next
    })
  }

  const sized = canResize && layout != null

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
              width: layout.width,
              height: layout.height,
              maxWidth: '100%',
              transform: `translate(${layout.offsetX}px, ${layout.offsetY}px)`,
            }
          : undefined
      }
    >
      {sized ? (
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Move conversation panel"
          onPointerDown={onMovePointerDown}
          onPointerMove={onMovePointerMove}
          onPointerUp={onMovePointerUp}
          onPointerCancel={onMovePointerUp}
          className={cn(
            'absolute inset-x-0 top-0 z-20 flex h-4 cursor-grab touch-none items-center justify-center',
            isMoving && 'cursor-grabbing',
          )}
        >
          <span
            className="pointer-events-none h-1 w-10 rounded-full bg-current opacity-25"
            aria-hidden
          />
        </div>
      ) : null}
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      {canResize ? (
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize conversation panel"
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          onPointerCancel={onResizePointerUp}
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
