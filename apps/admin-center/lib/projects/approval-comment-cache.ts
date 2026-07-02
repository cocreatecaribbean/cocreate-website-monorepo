import type { QueryClient } from '@tanstack/react-query'
import {
  appendApprovalCommentToProjectItems,
  replacePendingApprovalCommentInProjectItems,
  type ApprovalCommentLike,
} from '@cocreate/app-ui/approval-comment-cache'

import { adminQueryKeys } from '@/lib/api/query-keys'
import type { ThreadApprovalItem } from '@/lib/projects/thread-approval-items'

export function patchProjectApprovalCommentsCache(
  queryClient: QueryClient,
  projectId: string,
  approvalItemId: string,
  comment: ApprovalCommentLike,
  options?: { includeComments?: boolean },
) {
  const includeComments = options?.includeComments ?? true
  const queryKey = adminQueryKeys.approvals.project(projectId, { includeComments })
  queryClient.setQueryData<ThreadApprovalItem[]>(queryKey, (current) =>
    current
      ? appendApprovalCommentToProjectItems(current, approvalItemId, comment)
      : current,
  )
}

export function replacePendingProjectApprovalCommentCache(
  queryClient: QueryClient,
  projectId: string,
  approvalItemId: string,
  pendingId: string,
  serverComment: ApprovalCommentLike | null,
  options?: { includeComments?: boolean },
) {
  const includeComments = options?.includeComments ?? true
  const queryKey = adminQueryKeys.approvals.project(projectId, { includeComments })
  queryClient.setQueryData<ThreadApprovalItem[]>(queryKey, (current) =>
    current
      ? replacePendingApprovalCommentInProjectItems(
          current,
          approvalItemId,
          pendingId,
          serverComment,
        )
      : current,
  )
}

type RevisionPatchInput = {
  status: ThreadApprovalItem['status']
  revisionNumber: number
  attachment?: ThreadApprovalItem['attachment']
  comment: ApprovalCommentLike
}

export function patchProjectApprovalRevisionCache(
  queryClient: QueryClient,
  projectId: string,
  approvalItemId: string,
  patch: RevisionPatchInput,
  options?: { includeComments?: boolean },
) {
  const includeComments = options?.includeComments ?? true
  const queryKey = adminQueryKeys.approvals.project(projectId, { includeComments })
  queryClient.setQueryData<ThreadApprovalItem[]>(queryKey, (current) =>
    current
      ? appendApprovalCommentToProjectItems(
          current.map((item) =>
            item.id === approvalItemId
              ? {
                  ...item,
                  status: patch.status,
                  revisionNumber: patch.revisionNumber,
                  attachment: patch.attachment ?? item.attachment,
                }
              : item,
          ),
          approvalItemId,
          patch.comment,
        )
      : current,
  )
}
