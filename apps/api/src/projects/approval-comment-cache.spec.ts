import {
  appendApprovalCommentToList,
  appendApprovalCommentToProjectItems,
  createOptimisticApprovalComment,
  isPendingApprovalComment,
  replacePendingApprovalComment,
  replacePendingApprovalCommentInProjectItems,
} from '@cocreate/app-ui/approval-comment-cache'

describe('approval-comment-cache', () => {
  const baseComment = {
    id: 'comment-1',
    approvalItemId: 'item-1',
    authorRole: 'CLIENT' as const,
    authorDisplayName: 'Alex',
    body: 'Please adjust colors',
    createdAt: '2026-06-20T10:00:00.000Z',
  }

  it('detects pending comment ids', () => {
    expect(isPendingApprovalComment('pending-abc')).toBe(true)
    expect(isPendingApprovalComment('comment-1')).toBe(false)
  })

  it('creates optimistic comments with pending ids', () => {
    const optimistic = createOptimisticApprovalComment({
      approvalItemId: 'item-1',
      body: 'Hello',
      authorRole: 'ADMIN',
      authorDisplayName: 'Sam',
    })

    expect(optimistic.id).toMatch(/^pending-/)
    expect(optimistic.body).toBe('Hello')
    expect(optimistic.authorDisplayName).toBe('Sam')
  })

  it('appends comments without duplicates', () => {
    const next = appendApprovalCommentToList([baseComment], baseComment)
    expect(next).toHaveLength(1)

    const optimistic = createOptimisticApprovalComment({
      approvalItemId: 'item-1',
      body: 'Follow up',
      authorRole: 'CLIENT',
      authorDisplayName: 'Alex',
    })
    const appended = appendApprovalCommentToList([baseComment], optimistic)
    expect(appended).toHaveLength(2)
  })

  it('replaces pending comments with server rows', () => {
    const optimistic = createOptimisticApprovalComment({
      approvalItemId: 'item-1',
      body: 'Follow up',
      authorRole: 'CLIENT',
      authorDisplayName: 'Alex',
    })
    const serverComment = { ...baseComment, id: 'comment-2', body: 'Follow up' }
    const replaced = replacePendingApprovalComment(
      [baseComment, optimistic],
      optimistic.id,
      serverComment,
    )

    expect(replaced.map((comment) => comment.id)).toEqual(['comment-1', 'comment-2'])
  })

  it('patches project approval items with nested comments', () => {
    const optimistic = createOptimisticApprovalComment({
      approvalItemId: 'item-1',
      body: 'Reply',
      authorRole: 'ADMIN',
      authorDisplayName: 'Sam',
    })
    const items = [
      { id: 'item-1', comments: [baseComment] },
      { id: 'item-2', comments: [] },
    ]
    const patched = appendApprovalCommentToProjectItems(items, 'item-1', optimistic)
    expect(patched[0]?.comments).toHaveLength(2)
    expect(patched[1]?.comments).toHaveLength(0)

    const serverComment = { ...optimistic, id: 'comment-3' }
    const replaced = replacePendingApprovalCommentInProjectItems(
      patched,
      'item-1',
      optimistic.id,
      serverComment,
    )
    expect(replaced[0]?.comments.map((comment) => comment.id)).toEqual([
      'comment-1',
      'comment-3',
    ])
  })
})
