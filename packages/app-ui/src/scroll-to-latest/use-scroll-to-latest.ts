'use client'

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

import {
  DEFAULT_NEAR_BOTTOM_THRESHOLD,
  hasItemsSignatureChanged,
  itemsSignature,
  isNearBottom,
  PIN_BOTTOM_MS,
  resolveShouldFollowScroll,
  scrollEndIntoView,
  shouldResetScrollOnScopeChange,
} from './scroll-to-latest-utils'

export type ScrollToLatestMode = 'always' | 'near-bottom' | 'pinned'

export type UseScrollToLatestOptions = {
  scopeKey?: string
  scrollOn?: ScrollToLatestMode
  smoothOnUserSend?: boolean
  nearBottomThreshold?: number
  enabled?: boolean
}

export function useScrollToLatest<T extends HTMLElement = HTMLDivElement>(
  items: Array<{ id: string }>,
  options?: UseScrollToLatestOptions,
) {
  const {
    scopeKey,
    scrollOn = 'pinned',
    smoothOnUserSend = false,
    nearBottomThreshold = DEFAULT_NEAR_BOTTOM_THRESHOLD,
    enabled = true,
  } = options ?? {}

  const containerRef = useRef<T | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const prevSignatureRef = useRef('')
  const nearBottomRef = useRef(true)
  const hasInitialScrollRef = useRef(false)
  const pinBottomUntilRef = useRef(0)
  const prevScopeKeyRef = useRef(scopeKey)
  const smoothNextRef = useRef(false)

  const signature = itemsSignature(items)

  const shouldFollow = useCallback(
    (force = false) => {
      if (!enabled) return false
      const container = containerRef.current
      const nearBottom = container
        ? isNearBottom(container, nearBottomThreshold)
        : nearBottomRef.current
      return resolveShouldFollowScroll({
        scrollOn,
        nearBottom,
        pinBottomUntil: pinBottomUntilRef.current,
        force,
      })
    },
    [enabled, nearBottomThreshold, scrollOn],
  )

  const scrollToLatest = useCallback(
    (force = false, smooth = false) => {
      if (!shouldFollow(force)) return
      const container = containerRef.current
      const anchor = endRef.current
      if (!container || !anchor) return

      nearBottomRef.current = true
      if (force) {
        pinBottomUntilRef.current = Date.now() + PIN_BOTTOM_MS
      }
      scrollEndIntoView(container, anchor, smooth ? 'smooth' : 'auto')
    },
    [shouldFollow],
  )

  const notifyUserSent = useCallback(() => {
    smoothNextRef.current = smoothOnUserSend
    pinBottomUntilRef.current = Date.now() + PIN_BOTTOM_MS
    nearBottomRef.current = true
    scrollToLatest(true, smoothOnUserSend)
  }, [scrollToLatest, smoothOnUserSend])

  const notifyItemsChanged = useCallback(
    (force = false) => {
      scrollToLatest(force, smoothNextRef.current)
      smoothNextRef.current = false
    },
    [scrollToLatest],
  )

  useLayoutEffect(() => {
    if (shouldResetScrollOnScopeChange(prevScopeKeyRef.current, scopeKey)) {
      prevScopeKeyRef.current = scopeKey
      hasInitialScrollRef.current = false
      prevSignatureRef.current = ''
      pinBottomUntilRef.current = 0
      nearBottomRef.current = true
    }
  }, [scopeKey])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return

    const updateNearBottom = () => {
      nearBottomRef.current = isNearBottom(container, nearBottomThreshold)
    }

    updateNearBottom()
    container.addEventListener('scroll', updateNearBottom, { passive: true })

    const observer = new ResizeObserver(() => {
      if (shouldFollow(false)) {
        scrollEndIntoView(container, endRef.current, 'auto')
        nearBottomRef.current = true
      }
      updateNearBottom()
    })
    observer.observe(container)

    return () => {
      container.removeEventListener('scroll', updateNearBottom)
      observer.disconnect()
    }
  }, [enabled, nearBottomThreshold, shouldFollow])

  useLayoutEffect(() => {
    if (!enabled) return
    const container = containerRef.current
    const anchor = endRef.current
    if (!container || !anchor) return

    const prev = prevSignatureRef.current
    const isNew = hasItemsSignatureChanged(prev, signature)
    prevSignatureRef.current = signature

    if (!hasInitialScrollRef.current && items.length >= 0) {
      hasInitialScrollRef.current = true
      nearBottomRef.current = true
      pinBottomUntilRef.current = Date.now() + PIN_BOTTOM_MS
      scrollEndIntoView(container, anchor, 'auto')
      return
    }

    if (!isNew) return

    const smooth = smoothNextRef.current
    smoothNextRef.current = false
    if (shouldFollow(false)) {
      nearBottomRef.current = true
      pinBottomUntilRef.current = Date.now() + PIN_BOTTOM_MS
      scrollEndIntoView(container, anchor, smooth ? 'smooth' : 'auto')
    }
  }, [enabled, items.length, shouldFollow, signature])

  return {
    containerRef,
    endRef,
    scrollToLatest,
    notifyUserSent,
    notifyItemsChanged,
    /** @deprecated Use scrollToLatest */
    scrollToBottom: scrollToLatest,
  }
}
