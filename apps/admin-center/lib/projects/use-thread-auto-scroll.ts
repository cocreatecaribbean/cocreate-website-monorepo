'use client'

import { useScrollToLatest } from '@cocreate/app-ui/scroll-to-latest'

type MessageLike = { id: string }

export function useThreadAutoScroll(messages: MessageLike[], threadKey?: string) {
  const {
    containerRef,
    endRef,
    notifyUserSent,
    scrollToLatest,
    unseenCount,
    isNearBottom,
  } = useScrollToLatest<HTMLDivElement>(messages, {
    scopeKey: threadKey,
    smoothOnUserSend: true,
  })

  return {
    panelRef: containerRef,
    endRef,
    notifyUserSent,
    scrollToBottom: scrollToLatest,
    unseenCount,
    isNearBottom,
  }
}
