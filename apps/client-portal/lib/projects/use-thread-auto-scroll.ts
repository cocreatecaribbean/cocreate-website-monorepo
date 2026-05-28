'use client'

import { useCallback, useEffect, useRef } from 'react'

type MessageLike = { id: string }

const NEAR_BOTTOM_THRESHOLD = 80

function isNearBottom(panel: HTMLDivElement) {
  return panel.scrollHeight - panel.scrollTop - panel.clientHeight < NEAR_BOTTOM_THRESHOLD
}

function scrollPanelAfterLayout(panel: HTMLDivElement, behavior: ScrollBehavior) {
  const scroll = () => panel.scrollTo({ top: panel.scrollHeight, behavior })
  requestAnimationFrame(() => {
    scroll()
    requestAnimationFrame(scroll)
  })
}

export function useThreadAutoScroll(messages: MessageLike[]) {
  const panelRef = useRef<HTMLDivElement>(null)
  const prevSignatureRef = useRef('')
  const nearBottomRef = useRef(true)
  const hasInitialScrollRef = useRef(false)

  const lastId = messages[messages.length - 1]?.id ?? ''
  const signature = `${messages.length}:${lastId}`

  const scrollToBottom = useCallback(
    (force = false) => {
      const panel = panelRef.current
      if (!panel) return

      const nearBottom = isNearBottom(panel)
      if (force || nearBottom || messages.length <= 1) {
        nearBottomRef.current = true
        scrollPanelAfterLayout(panel, 'smooth')
      }
    },
    [messages.length],
  )

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    const updateNearBottom = () => {
      nearBottomRef.current = isNearBottom(panel)
    }

    updateNearBottom()
    panel.addEventListener('scroll', updateNearBottom, { passive: true })

    const observer = new ResizeObserver(() => {
      if (nearBottomRef.current) {
        panel.scrollTo({ top: panel.scrollHeight, behavior: 'auto' })
      }
      updateNearBottom()
    })
    observer.observe(panel)

    return () => {
      panel.removeEventListener('scroll', updateNearBottom)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const prev = prevSignatureRef.current
    const isNew = prev !== '' && signature !== prev
    prevSignatureRef.current = signature

    if (!hasInitialScrollRef.current && messages.length > 0) {
      hasInitialScrollRef.current = true
      scrollToBottom(true)
      return
    }

    if (isNew) {
      scrollToBottom(false)
    }
  }, [messages.length, signature, scrollToBottom])

  return { panelRef, scrollToBottom }
}
