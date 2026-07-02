'use client'

import type { RefObject } from 'react'

import {
  isPendingApprovalComment,
  type ApprovalCommentLike,
} from './approval-comment-cache'
import { isApprovalCommentMine } from './approval-comment-message-list-utils'
import { ThreadScrollEnd } from './scroll-to-latest'

export { isApprovalCommentMine } from './approval-comment-message-list-utils'

type ApprovalCommentMessageListProps = {
  comments: ApprovalCommentLike[]
  viewerRole: 'CLIENT' | 'ADMIN'
  variant: 'portal' | 'admin'
  listRef?: RefObject<HTMLUListElement | null>
  endRef?: RefObject<HTMLDivElement | null>
  density?: 'compact' | 'comfortable'
  showTimestamp?: boolean
  listClassName?: string
  className?: string
}

const densityClasses = {
  compact: {
    list: 'max-h-32 space-y-2',
    meta: 'text-[0.65rem]',
    bubble: 'text-xs leading-relaxed px-2 py-1.5',
    maxWidth: 'max-w-[95%]',
  },
  comfortable: {
    list: 'max-h-64 space-y-3',
    meta: 'text-xs',
    bubble: 'text-sm leading-relaxed px-3 py-2',
    maxWidth: 'max-w-[90%]',
  },
} as const

export default function ApprovalCommentMessageList({
  comments,
  viewerRole,
  variant,
  listRef,
  endRef,
  density = 'comfortable',
  showTimestamp = false,
  listClassName,
  className,
}: ApprovalCommentMessageListProps) {
  const styles = densityClasses[density]
  const mineClass = variant === 'portal' ? 'portal-msg-mine' : 'admin-msg-mine'
  const theirsClass = variant === 'portal' ? 'portal-msg-theirs' : 'admin-msg-theirs'

  return (
    <ul
      ref={listRef}
      className={`overflow-y-auto ${listClassName ?? styles.list} ${className ?? ''}`.trim()}
    >
      {comments.map((comment) => {
        const isMine = isApprovalCommentMine(comment, viewerRole)
        return (
          <li
            key={comment.id}
            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
          >
            <p className={`font-medium text-app-muted ${styles.meta}`}>
              {isMine ? 'You' : comment.authorDisplayName}
              {showTimestamp ? ` · ${new Date(comment.createdAt).toLocaleString()}` : ''}
            </p>
            <div
              className={`mt-1 rounded-lg ${styles.maxWidth} ${styles.bubble} ${
                isMine ? mineClass : theirsClass
              } ${isPendingApprovalComment(comment.id) ? 'opacity-70' : ''}`}
            >
              <p className="whitespace-pre-wrap">{comment.body}</p>
            </div>
          </li>
        )
      })}
      {endRef ? <ThreadScrollEnd as="li" ref={endRef} /> : null}
    </ul>
  )
}
