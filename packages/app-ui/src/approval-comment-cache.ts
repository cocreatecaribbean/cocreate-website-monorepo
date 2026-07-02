export type ApprovalCommentLike = {
  id: string
  approvalItemId?: string
  authorUserId?: string
  authorRole: 'ADMIN' | 'CLIENT' | 'COLLABORATOR'
  authorDisplayName: string
  body: string
  createdAt: string
}

export function isPendingApprovalComment(id: string): boolean {
  return id.startsWith('pending-')
}

export function createOptimisticApprovalComment(params: {
  approvalItemId: string
  body: string
  authorRole: 'ADMIN' | 'CLIENT' | 'COLLABORATOR'
  authorDisplayName: string
  authorUserId?: string
}): ApprovalCommentLike {
  return {
    id: `pending-${crypto.randomUUID()}`,
    approvalItemId: params.approvalItemId,
    authorUserId: params.authorUserId,
    authorRole: params.authorRole,
    authorDisplayName: params.authorDisplayName,
    body: params.body,
    createdAt: new Date().toISOString(),
  }
}

export function appendApprovalCommentToList<T extends ApprovalCommentLike>(
  comments: T[] | undefined,
  comment: T,
): T[] {
  const current = comments ?? []
  if (current.some((entry) => entry.id === comment.id)) return current
  return [...current, comment]
}

export function replacePendingApprovalComment<T extends ApprovalCommentLike>(
  comments: T[] | undefined,
  pendingId: string,
  serverComment: T | null,
): T[] {
  const withoutPending = (comments ?? []).filter((comment) => comment.id !== pendingId)
  if (serverComment) return [...withoutPending, serverComment]
  return withoutPending
}

export function appendApprovalCommentToProjectItems<
  T extends { id: string; comments: C[] },
  C extends ApprovalCommentLike,
>(items: T[], approvalItemId: string, comment: C): T[] {
  return items.map((item) =>
    item.id === approvalItemId
      ? { ...item, comments: appendApprovalCommentToList(item.comments, comment) }
      : item,
  )
}

export function replacePendingApprovalCommentInProjectItems<
  T extends { id: string; comments: C[] },
  C extends ApprovalCommentLike,
>(items: T[], approvalItemId: string, pendingId: string, serverComment: C | null): T[] {
  return items.map((item) =>
    item.id === approvalItemId
      ? {
          ...item,
          comments: replacePendingApprovalComment(item.comments, pendingId, serverComment),
        }
      : item,
  )
}
