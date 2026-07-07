'use client'

import gsap from 'gsap'
import { MessageCircle } from 'lucide-react'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import AssistantChat, { type AssistantContext } from './assistant-chat'

export type AssistantShellProps = {
  context: AssistantContext
  api: string
  title?: string
  greeting?: string
  placeholder?: string
  /** Extra positioning class, e.g. stack above cookie banner */
  positionClassName?: string
  /** Panel open/close animation mode */
  animation?: 'css' | 'gsap'
}

const PANEL_OPEN_DURATION = 0.5
const PANEL_CLOSE_DURATION = 0.35
const CSS_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const CSS_DURATION_MS = 400

const shellBaseClassName =
  'fixed right-4 z-[235] flex flex-col items-end gap-3 sm:right-6 bottom-[max(1.25rem,env(safe-area-inset-bottom))]'

const panelClassName =
  'flex h-[min(70vh,28rem)] w-[min(calc(100vw-2rem),22rem)] flex-col overflow-hidden rounded-2xl border border-chambray/10 bg-white shadow-[0_12px_40px_rgba(57,65,154,0.18)]'

const fabBaseClassName =
  'flex h-14 w-14 items-center justify-center rounded-full bg-chambray text-casablanca shadow-[0_8px_24px_rgba(57,65,154,0.35)] transition hover:bg-sanmarino hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-casablanca'

const fabOpenClassName = 'bg-sanmarino text-white'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function AssistantShell({
  context,
  api,
  title = 'Ask CoCreate',
  greeting = 'Hi CoCreator!',
  placeholder = 'Type here for assistance...',
  positionClassName,
  animation = 'css',
}: AssistantShellProps) {
  const panelId = useId()
  const fabRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const hasOpenedRef = useRef(false)
  const isAnimatingRef = useRef(false)
  const [open, setOpen] = useState(false)
  const [panelAlive, setPanelAlive] = useState(false)
  const [cssPanelOpen, setCssPanelOpen] = useState(false)

  const finishClose = useCallback(() => {
    isAnimatingRef.current = false
    setPanelAlive(false)
    requestAnimationFrame(() => fabRef.current?.focus())
  }, [])

  const close = useCallback(() => {
    if (!open) return
    if (isAnimatingRef.current) return
    setOpen(false)
  }, [open])

  const toggle = useCallback(() => {
    if (isAnimatingRef.current) return
    if (open) {
      close()
      return
    }
    setPanelAlive(true)
    setOpen(true)
  }, [close, open])

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel || !panelAlive || animation !== 'gsap') return

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
      timelineRef.current = gsap.timeline({
        onComplete: () => {
          gsap.set(panel, { autoAlpha: 0, scale: 0.88, y: 16 })
          finishClose()
        },
      }).to(panel, {
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
  }, [animation, finishClose, open, panelAlive])

  useLayoutEffect(() => {
    if (!panelAlive || animation !== 'css') return

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
  }, [animation, finishClose, open, panelAlive])

  const onPanelTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLDivElement>) => {
      if (animation !== 'css' || event.target !== panelRef.current) return
      if (event.propertyName !== 'opacity' && event.propertyName !== 'transform') return
      if (!open && panelAlive) {
        isAnimatingRef.current = false
        finishClose()
      }
    },
    [animation, finishClose, open, panelAlive],
  )

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [close, open])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || fabRef.current?.contains(target)) return
      close()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [close, open])

  const panelStyle =
    animation === 'css'
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
          willChange: 'transform, opacity' as const,
        }

  return (
    <div
      className={`${shellBaseClassName} ${positionClassName ?? ''}`.trim()}
      data-assistant-open={open ? 'true' : 'false'}
    >
      {panelAlive ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-label={title}
          aria-hidden={animation === 'gsap' ? !panelAlive : !cssPanelOpen}
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
            onClose={close}
          />
        </div>
      ) : null}

      <button
        ref={fabRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelAlive ? panelId : undefined}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        onClick={toggle}
        className={`${fabBaseClassName} ${open ? fabOpenClassName : ''}`.trim()}
      >
        <MessageCircle className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  )
}
