'use client'

import { NESTED_NEAR_BOTTOM_THRESHOLD, useScrollToLatest } from './scroll-to-latest'

type CommentLike = { id: string }

/** @deprecated Use useScrollToLatest from @cocreate/app-ui/scroll-to-latest */
export function useCommentListAutoScroll(
  comments: CommentLike[],
  listKey?: string,
  options?: { smoothOnSend?: boolean },
) {
  const { containerRef, endRef, notifyUserSent, scrollToLatest } = useScrollToLatest<HTMLUListElement>(
    comments,
    {
      scopeKey: listKey,
      smoothOnUserSend: options?.smoothOnSend ?? true,
      nearBottomThreshold: NESTED_NEAR_BOTTOM_THRESHOLD,
    },
  )

  return {
    listRef: containerRef,
    endRef,
    scrollToBottom: scrollToLatest,
    scrollToBottomOnSend: notifyUserSent,
    notifyUserSent,
  }
}
