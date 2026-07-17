'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from './cn'

const DEFAULT_MIN = 72
const DEFAULT_MAX = 320

type ResizableMessageTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'style'
> & {
  /** sessionStorage key so height persists per surface */
  storageKey?: string
  minHeight?: number
  maxHeight?: number
  className?: string
  handleClassName?: string
}

export const ResizableMessageTextarea = forwardRef<
  HTMLTextAreaElement,
  ResizableMessageTextareaProps
>(function ResizableMessageTextarea(
  {
    storageKey,
    minHeight = DEFAULT_MIN,
    maxHeight = DEFAULT_MAX,
    className,
    handleClassName,
    onChange,
    ...props
  },
  ref,
) {
  const reactId = useId()
  const key = storageKey ?? `msg-composer-${reactId}`
  const [height, setHeight] = useState(minHeight)
  const dragRef = useRef<{ startY: number; startH: number } | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key)
      if (!raw) return
      const parsed = Number(raw)
      if (Number.isFinite(parsed)) {
        setHeight(Math.min(maxHeight, Math.max(minHeight, parsed)))
      }
    } catch {
      // ignore
    }
  }, [key, minHeight, maxHeight])

  const persist = useCallback(
    (next: number) => {
      try {
        sessionStorage.setItem(key, String(next))
      } catch {
        // ignore
      }
    },
    [key],
  )

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragRef.current = { startY: event.clientY, startH: height }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const delta = event.clientY - dragRef.current.startY
    const next = Math.min(
      maxHeight,
      Math.max(minHeight, dragRef.current.startH + delta),
    )
    setHeight(next)
  }

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    dragRef.current = null
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // ignore
    }
    persist(height)
  }

  return (
    <div className="relative w-full">
      <textarea
        {...props}
        ref={ref}
        onChange={onChange}
        className={cn(className, 'resize-none')}
        style={{ height }}
      />
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize message box"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={cn(
          'absolute inset-x-0 bottom-0 z-10 flex h-3 cursor-ns-resize touch-none items-center justify-center',
          handleClassName,
        )}
      >
        <span className="h-1 w-8 rounded-full bg-current opacity-25" />
      </div>
    </div>
  )
})

export default ResizableMessageTextarea
