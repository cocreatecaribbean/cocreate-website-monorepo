'use client'

import { useEffect, useState, type RefObject } from 'react'

function checkIsClamped(element: HTMLElement | null): boolean {
  if (!element) return false
  return element.scrollHeight > element.clientHeight
}

export function useIsTextClamped(ref: RefObject<HTMLElement | null>): boolean {
  const [isClamped, setIsClamped] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const update = () => {
      setIsClamped(checkIsClamped(element))
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(element)
    window.addEventListener('resize', update)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [ref])

  return isClamped
}
