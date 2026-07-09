'use client'

import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type ReactElement,
} from 'react'
import { createPortal } from 'react-dom'

export type NavTooltipProps = {
  description?: string | null
  children: ReactElement<{ 'aria-describedby'?: string }>
  side?: 'right' | 'top'
  className?: string
}

function canHoverWithFinePointer(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

function bubbleStyle(rect: DOMRect, side: 'right' | 'top'): CSSProperties {
  if (side === 'top') {
    return {
      left: rect.left + rect.width / 2,
      top: rect.top - 8,
      transform: 'translate(-50%, -100%)',
    }
  }
  return {
    left: rect.right + 8,
    top: rect.top + rect.height / 2,
    transform: 'translateY(-50%)',
  }
}

export default function NavTooltip({
  description,
  children,
  side = 'right',
  className,
}: NavTooltipProps) {
  const tooltipId = useId()
  const hostRef = useRef<HTMLSpanElement>(null)
  const [hovering, setHovering] = useState(false)
  const [focused, setFocused] = useState(false)
  const [bubblePosition, setBubblePosition] = useState<CSSProperties>({})
  const [sidebarTone, setSidebarTone] = useState(false)
  const [mounted, setMounted] = useState(false)
  const open = hovering || focused

  useEffect(() => {
    setMounted(true)
  }, [])

  const updatePosition = useCallback(() => {
    const host = hostRef.current
    if (!host) return
    const trigger = host.firstElementChild as HTMLElement | null
    if (!trigger) return
    setBubblePosition(bubbleStyle(trigger.getBoundingClientRect(), side))
    setSidebarTone(Boolean(host.closest('.portal-sl-sidebar, .portal-drawer-aside')))
  }, [side])

  useEffect(() => {
    if (!open) return
    const handleReposition = () => {
      updatePosition()
      const host = hostRef.current
      if (hovering && host && !host.matches(':hover')) {
        setHovering(false)
      }
    }
    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)
    return () => {
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [open, hovering, updatePosition])

  const handlePointerEnter = useCallback(() => {
    if (!canHoverWithFinePointer()) return
    updatePosition()
    setHovering(true)
  }, [updatePosition])

  const handlePointerLeave = useCallback(() => {
    setHovering(false)
  }, [])

  const handleFocusIn = useCallback((event: FocusEvent<HTMLSpanElement>) => {
    const target = event.target as HTMLElement | null
    if (!target?.matches(':focus-visible')) return
    updatePosition()
    setFocused(true)
  }, [updatePosition])

  const handleFocusOut = useCallback((event: FocusEvent<HTMLSpanElement>) => {
    const host = hostRef.current
    if (host?.contains(event.relatedTarget as Node)) return
    setFocused(false)
  }, [])

  if (!description?.trim()) {
    return children
  }

  const existingDescribedBy = children.props['aria-describedby']
  const describedBy = existingDescribedBy
    ? `${existingDescribedBy} ${tooltipId}`
    : tooltipId

  const bubble =
    mounted && open
      ? createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            className={`nav-tooltip-bubble nav-tooltip-bubble--open${sidebarTone ? ' nav-tooltip-bubble--sidebar' : ''}`}
            style={bubblePosition}
          >
            {description}
          </span>,
          document.body,
        )
      : null

  return (
    <span
      ref={hostRef}
      className={`nav-tooltip-host ${side === 'top' ? 'nav-tooltip-host--top' : ''} ${className ?? ''}`.trim()}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocusCapture={handleFocusIn}
      onBlurCapture={handleFocusOut}
    >
      {cloneElement(children, { 'aria-describedby': describedBy })}
      {bubble}
    </span>
  )
}
