'use client'

import gsap from 'gsap'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { MessageCircle } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import AssistantChat, { type AssistantContext } from './assistant-chat'

export type AssistantShellProps = {
  context: AssistantContext
  api: string
  title?: string
  greeting?: string
  placeholder?: string
  /** Extra positioning class, e.g. lift above TanStack Query Devtools in dev */
  positionClassName?: string
  /** Panel open/close animation mode */
  animation?: 'css' | 'gsap'
  /** Merged into each chat API request body (e.g. current path / tab). */
  requestExtras?: Record<string, unknown>
  /** Soft-navigate relative `/…` links in assistant replies (e.g. router.push). */
  onNavigate?: (href: string) => void
}

const PANEL_OPEN_DURATION = 0.5
const PANEL_CLOSE_DURATION = 0.35
const CSS_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const CSS_DURATION_MS = 400

const REM = 16
const DEFAULT_WIDTH_REM = 28
const DEFAULT_HEIGHT_REM = 36
const MIN_WIDTH_REM = 20
const MIN_HEIGHT_REM = 24
const DEFAULT_HEIGHT_VH = 0.8
const MAX_HEIGHT_VH = 0.9
const VIEWPORT_PADDING = 32

const shellBaseClassName =
  'pointer-events-none fixed inset-x-4 z-[235] flex flex-col items-end gap-3 sm:inset-x-6 bottom-[max(1.25rem,env(safe-area-inset-bottom))]'

const panelClassName =
  'pointer-events-auto absolute right-0 bottom-[calc(100%+0.75rem)] flex w-full max-w-[28rem] flex-col overflow-hidden rounded-2xl border border-chambray/10 bg-white shadow-[0_12px_40px_rgba(57,65,154,0.18)]'

const fabBaseClassName =
  'pointer-events-auto flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full bg-sanmarino text-casablanca shadow-[0_8px_24px_rgba(15,76,129,0.35)] outline outline-2 outline-offset-4 outline-casablanca transition hover:bg-casablanca hover:text-sanmarino focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-casablanca'

const fabOpenClassName = 'bg-chambray text-casablanca'

type PanelSize = { width: number; height: number }

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function sizeStorageKey(context: AssistantContext) {
  return `cocreate.assistant.size.${context}`
}

function openStorageKey(context: AssistantContext) {
  return `cocreate.assistant.open.${context}`
}

function readOpenState(context: AssistantContext): boolean {
  try {
    return sessionStorage.getItem(openStorageKey(context)) === 'true'
  } catch {
    return false
  }
}

function writeOpenState(context: AssistantContext, nextOpen: boolean) {
  try {
    if (nextOpen) {
      sessionStorage.setItem(openStorageKey(context), 'true')
    } else {
      sessionStorage.removeItem(openStorageKey(context))
    }
  } catch {
    // ignore
  }
}

function clampPanelSize(width: number, height: number): PanelSize {
  const maxWidth = Math.max(0, window.innerWidth - VIEWPORT_PADDING)
  const maxHeight = Math.max(0, window.innerHeight * MAX_HEIGHT_VH)
  const minWidth = Math.min(MIN_WIDTH_REM * REM, maxWidth)
  const minHeight = Math.min(MIN_HEIGHT_REM * REM, maxHeight)
  return {
    width: Math.min(maxWidth, Math.max(minWidth, width)),
    height: Math.min(maxHeight, Math.max(minHeight, height)),
  }
}

function defaultPanelSize(): PanelSize {
  return clampPanelSize(
    Math.min(window.innerWidth - VIEWPORT_PADDING, DEFAULT_WIDTH_REM * REM),
    Math.min(window.innerHeight * DEFAULT_HEIGHT_VH, DEFAULT_HEIGHT_REM * REM),
  )
}

function readPanelSize(context: AssistantContext): PanelSize {
  try {
    const raw = localStorage.getItem(sizeStorageKey(context))
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PanelSize>
      if (
        typeof parsed.width === 'number' &&
        typeof parsed.height === 'number' &&
        Number.isFinite(parsed.width) &&
        Number.isFinite(parsed.height)
      ) {
        return clampPanelSize(parsed.width, parsed.height)
      }
    }
  } catch {
    // ignore
  }
  return defaultPanelSize()
}

function writePanelSize(context: AssistantContext, size: PanelSize) {
  try {
    localStorage.setItem(sizeStorageKey(context), JSON.stringify(size))
  } catch {
    // ignore
  }
}

export default function AssistantShell({
  context,
  api,
  title = 'Ask CoCreate',
  greeting = 'Hi CoCreator!',
  placeholder = 'Type here for assistance...',
  positionClassName,
  animation = 'css',
  requestExtras,
  onNavigate,
}: AssistantShellProps) {
  const panelId = useId()
  const fabRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const hasOpenedRef = useRef(false)
  const isAnimatingRef = useRef(false)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    startWidth: number
    startHeight: number
  } | null>(null)
  const [open, setOpen] = useState(false)
  /** Once true, stays true so AssistantChat is not unmounted on close. */
  const [panelMounted, setPanelMounted] = useState(false)
  const [cssPanelOpen, setCssPanelOpen] = useState(false)
  const [panelSize, setPanelSize] = useState<PanelSize | null>(null)

  useEffect(() => {
    setPanelSize(readPanelSize(context))
  }, [context])

  // Restore open panel after hard nav / remount (messages already use sessionStorage).
  useEffect(() => {
    if (!readOpenState(context)) return
    setPanelMounted(true)
    setOpen(true)
  }, [context])

  useEffect(() => {
    if (!panelSize) return
    let lastWidth = window.innerWidth
    const onResize = () => {
      const nextWidth = window.innerWidth
      // Soft keyboards typically change height only — skip reclamp to avoid layout thrash.
      if (nextWidth === lastWidth) return
      lastWidth = nextWidth
      setPanelSize((prev) => (prev ? clampPanelSize(prev.width, prev.height) : prev))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [panelSize])

  const finishClose = useCallback(() => {
    isAnimatingRef.current = false
    requestAnimationFrame(() => fabRef.current?.focus())
  }, [])

  const close = useCallback(() => {
    if (!open) return
    if (isAnimatingRef.current) return
    setOpen(false)
    writeOpenState(context, false)
  }, [context, open])

  const toggle = useCallback(() => {
    if (isAnimatingRef.current) return
    if (open) {
      close()
      return
    }
    setPanelMounted(true)
    setOpen(true)
    writeOpenState(context, true)
  }, [close, context, open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      close()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [close, open])

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel || !panelMounted || animation !== 'gsap') return

    timelineRef.current?.kill()

    if (prefersReducedMotion()) {
      gsap.set(panel, { autoAlpha: open ? 1 : 0, scale: 1, y: 0, transformOrigin: 'bottom right' })
      isAnimatingRef.current = false
      if (!open) finishClose()
      return
    }

    gsap.set(panel, { transformOrigin: 'bottom right', force3D: true })

    if (open) {
      hasOpenedRef.current = true
      isAnimatingRef.current = true
      timelineRef.current = gsap
        .timeline({
          onComplete: () => {
            isAnimatingRef.current = false
          },
        })
        .fromTo(
          panel,
          { autoAlpha: 0, scale: 0.88, y: 16 },
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            duration: PANEL_OPEN_DURATION,
            ease: 'expo.out',
          },
        )
    } else if (hasOpenedRef.current) {
      isAnimatingRef.current = true
      timelineRef.current = gsap
        .timeline({
          onComplete: () => {
            gsap.set(panel, { autoAlpha: 0, scale: 0.88, y: 16 })
            finishClose()
          },
        })
        .to(panel, {
          autoAlpha: 0,
          scale: 0.88,
          y: 16,
          duration: PANEL_CLOSE_DURATION,
          ease: 'power2.in',
        })
    }

    return () => {
      timelineRef.current?.kill()
    }
  }, [animation, finishClose, open, panelMounted])

  useLayoutEffect(() => {
    if (!panelMounted || animation !== 'css') return

    if (prefersReducedMotion()) {
      setCssPanelOpen(open)
      isAnimatingRef.current = false
      if (!open) finishClose()
      return
    }

    if (open) {
      isAnimatingRef.current = true
      const frame = requestAnimationFrame(() => {
        setCssPanelOpen(true)
        isAnimatingRef.current = false
      })
      return () => cancelAnimationFrame(frame)
    }

    isAnimatingRef.current = true
    setCssPanelOpen(false)
  }, [animation, finishClose, open, panelMounted])

  const onPanelTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLDivElement>) => {
      if (animation !== 'css' || event.target !== panelRef.current) return
      if (event.propertyName !== 'opacity' && event.propertyName !== 'transform') return
      if (!open && panelMounted) {
        isAnimatingRef.current = false
        finishClose()
      }
    },
    [animation, finishClose, open, panelMounted],
  )

  // On touch devices, lock page scroll while the panel is open.
  // Desktop keeps background scroll; the chat panel contains its own wheel/touch.
  useEffect(() => {
    if (!open) return
    if (window.matchMedia('(pointer: fine)').matches) return

    const html = document.documentElement
    const body = document.body
    const previousHtmlOverflow = html.style.overflow
    const previousBodyOverflow = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    ScrollSmoother.get()?.paused(true)

    return () => {
      html.style.overflow = previousHtmlOverflow
      body.style.overflow = previousBodyOverflow
      ScrollSmoother.get()?.paused(false)
    }
  }, [open])

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!panelSize) return
      event.preventDefault()
      event.stopPropagation()
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startWidth: panelSize.width,
        startHeight: panelSize.height,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [panelSize],
  )

  const onResizePointerMove = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    // Bottom-left handle: drag left grows width, drag down grows height
    const nextWidth = drag.startWidth + (drag.startX - event.clientX)
    const nextHeight = drag.startHeight + (event.clientY - drag.startY)
    setPanelSize(clampPanelSize(nextWidth, nextHeight))
  }, [])

  const onResizePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) return
      dragRef.current = null
      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch {
        // ignore
      }
      setPanelSize((prev) => {
        if (!prev) return prev
        const next = clampPanelSize(prev.width, prev.height)
        writePanelSize(context, next)
        return next
      })
    },
    [context],
  )

  const panelVisible = animation === 'css' ? cssPanelOpen : open

  const panelStyle: CSSProperties = {
    // Never use 100vw — it overflows on mobile when paired with fixed insets.
    maxWidth: '100%',
    ...(panelSize
      ? { width: panelSize.width, height: panelSize.height }
      : {
          width: '100%',
          height: `min(${DEFAULT_HEIGHT_VH * 100}dvh, ${DEFAULT_HEIGHT_REM}rem)`,
        }),
    ...(animation === 'css'
      ? {
          transformOrigin: 'bottom right' as const,
          opacity: cssPanelOpen ? 1 : 0,
          transform: cssPanelOpen ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(12px)',
          transition: `opacity ${CSS_DURATION_MS}ms ${CSS_EASE}, transform ${CSS_DURATION_MS}ms ${CSS_EASE}`,
          pointerEvents: (cssPanelOpen ? 'auto' : 'none') as 'auto' | 'none',
          willChange: 'transform, opacity' as const,
        }
      : {
          transformOrigin: 'bottom right' as const,
          pointerEvents: (open ? 'auto' : 'none') as 'auto' | 'none',
          willChange: 'transform, opacity' as const,
        }),
  }

  return (
    <div
      className={`${shellBaseClassName} ${positionClassName ?? ''}`.trim()}
      data-assistant-open={open ? 'true' : 'false'}
    >
      {panelMounted ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-label={title}
          aria-hidden={!panelVisible}
          inert={!panelVisible ? true : undefined}
          className={panelClassName}
          style={panelStyle}
          onTransitionEnd={onPanelTransitionEnd}
        >
          <AssistantChat
            context={context}
            api={api}
            title={title}
            greeting={greeting}
            placeholder={placeholder}
            open={open}
            onClose={close}
            requestExtras={requestExtras}
            onNavigate={onNavigate}
          />
          <button
            type="button"
            aria-label="Resize assistant panel"
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            onPointerCancel={onResizePointerUp}
            className="absolute bottom-0 left-0 z-20 flex h-4 w-4 cursor-sw-resize touch-none items-end justify-start rounded-bl-2xl p-0.5 text-chambray/35 transition hover:text-chambray/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sanmarino"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <path
                d="M1 9L9 1M1 9h4M1 9V5"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      ) : null}

      <button
        ref={fabRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelMounted ? panelId : undefined}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        onClick={toggle}
        className={`${fabBaseClassName} ${open ? fabOpenClassName : ''}`.trim()}
      >
        <MessageCircle className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  )
}
