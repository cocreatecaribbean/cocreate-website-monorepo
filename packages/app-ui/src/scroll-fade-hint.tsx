'use client'

import { ChevronDown } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from './cn'

type ScrollFadeHintProps = {
  children: ReactNode
  className?: string
  /** Classes applied to the scrollable element (e.g. max-h-*). */
  scrollClassName?: string
}

/**
 * Wraps a scroll region with soft top/bottom fades and a small chevron when
 * more content is available below — subtle but clear “this scrolls” cue.
 */
export function ScrollFadeHint({
  children,
  className,
  scrollClassName,
}: ScrollFadeHintProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const updateScrollHint = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollTop, clientHeight, scrollHeight } = el
    const overflow = scrollHeight > clientHeight + 4
    setCanScrollUp(overflow && scrollTop > 4)
    setCanScrollDown(overflow && scrollTop + clientHeight < scrollHeight - 8)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    updateScrollHint()

    const observer = new ResizeObserver(updateScrollHint)
    observer.observe(el)
    for (const child of el.children) {
      observer.observe(child)
    }

    el.addEventListener('scroll', updateScrollHint, { passive: true })

    return () => {
      observer.disconnect()
      el.removeEventListener('scroll', updateScrollHint)
    }
  }, [updateScrollHint, children])

  return (
    <div className={cn('relative min-h-0', className)}>
      <div
        ref={scrollRef}
        className={cn(
          'min-h-0 overflow-y-auto overscroll-y-contain',
          scrollClassName,
        )}
      >
        {children}
      </div>
      {canScrollUp ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-linear-to-b from-[var(--surface-card)] from-40% via-[color-mix(in_srgb,var(--surface-card)_75%,transparent)] to-transparent"
          aria-hidden
        />
      ) : null}
      {canScrollDown ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center justify-end bg-linear-to-t from-[var(--surface-card)] from-35% via-[color-mix(in_srgb,var(--surface-card)_85%,transparent)] to-transparent pb-1.5 pt-12"
          aria-hidden
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-card-solid)] text-sanmarino shadow-sm ring-1 ring-sanmarino/25">
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          </span>
          <span className="sr-only">Scroll for more</span>
        </div>
      ) : null}
    </div>
  )
}
