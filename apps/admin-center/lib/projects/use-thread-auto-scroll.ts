'use client'

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

type MessageLike = { id: string }

const NEAR_BOTTOM_THRESHOLD = 120
const PIN_BOTTOM_MS = 3000

function isNearBottom(panel: HTMLDivElement) {
  return panel.scrollHeight - panel.scrollTop - panel.clientHeight < NEAR_BOTTOM_THRESHOLD
}

function scrollPanelAfterLayout(panel: HTMLDivElement, behavior: ScrollBehavior) {
  const scroll = () => panel.scrollTo({ top: panel.scrollHeight, behavior })
  requestAnimationFrame(() => {
    scroll()
    requestAnimationFrame(scroll)
  })
  setTimeout(scroll, 0)
}

export function useThreadAutoScroll(messages: MessageLike[], threadKey?: string) {
  const panelRef = useRef<HTMLDivElement>(null)
  const prevSignatureRef = useRef('')
  const nearBottomRef = useRef(true)
  const hasInitialScrollRef = useRef(false)
  const pinBottomUntilRef = useRef(0)
  const prevThreadKeyRef = useRef(threadKey)

  const signature = messages.map((m) => m.id).join('|')

  const scrollToBottom = useCallback((force = false) => {
    const panel = panelRef.current
    if (!panel) return

    const atBottom = isNearBottom(panel)
    if (force || atBottom || messages.length <= 1) {
      nearBottomRef.current = true
      pinBottomUntilRef.current = Date.now() + PIN_BOTTOM_MS
      scrollPanelAfterLayout(panel, force ? 'smooth' : 'auto')
    }
  }, [messages.length])

  useLayoutEffect(() => {
    if (threadKey !== undefined && threadKey !== prevThreadKeyRef.current) {
      prevThreadKeyRef.current = threadKey
      hasInitialScrollRef.current = false
      prevSignatureRef.current = ''
      pinBottomUntilRef.current = 0
      nearBottomRef.current = true
    }
  }, [threadKey])

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    const updateNearBottom = () => {
      nearBottomRef.current = isNearBottom(panel)
    }

    updateNearBottom()
    panel.addEventListener('scroll', updateNearBottom, { passive: true })

    const observer = new ResizeObserver(() => {
      const pinned = Date.now() < pinBottomUntilRef.current
      if (nearBottomRef.current || pinned) {
        panel.scrollTo({ top: panel.scrollHeight, behavior: 'auto' })
        if (pinned) nearBottomRef.current = true
      }
      updateNearBottom()
    })
    observer.observe(panel)

    return () => {
      panel.removeEventListener('scroll', updateNearBottom)
      observer.disconnect()
    }
  }, [])

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel || messages.length === 0) return

    const prev = prevSignatureRef.current
    const isNew = prev !== '' && signature !== prev
    prevSignatureRef.current = signature

    if (!hasInitialScrollRef.current) {
      hasInitialScrollRef.current = true
      nearBottomRef.current = true
      pinBottomUntilRef.current = Date.now() + PIN_BOTTOM_MS
      scrollPanelAfterLayout(panel, 'auto')
      return
    }

    if (!isNew) return

    const atBottom = isNearBottom(panel)
    if (atBottom || messages.length <= 1) {
      nearBottomRef.current = true
      pinBottomUntilRef.current = Date.now() + PIN_BOTTOM_MS
      scrollPanelAfterLayout(panel, 'auto')
    }
  }, [signature, messages.length])

  return { panelRef, scrollToBottom }
}
