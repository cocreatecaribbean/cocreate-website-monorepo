import type { ApprovalCommentLike } from './approval-comment-cache'

export function isApprovalCommentMine(
  comment: Pick<ApprovalCommentLike, 'authorRole'>,
  viewerRole: 'CLIENT' | 'ADMIN',
): boolean {
  if (viewerRole === 'CLIENT') return comment.authorRole === 'CLIENT'
  return comment.authorRole === 'ADMIN' || comment.authorRole === 'COLLABORATOR'
}
