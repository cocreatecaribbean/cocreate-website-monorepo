import type { ThreadAttachment } from '@/lib/projects/thread-content'

export type ApprovalCommentItem = {
  id: string
  authorDisplayName: string
  authorRole: 'ADMIN' | 'CLIENT' | 'COLLABORATOR'
  body: string
  createdAt: string
}

export type ThreadApprovalItem = {
  id: string
  requestId: string
  messageId: string
  title: string
  status: 'PENDING' | 'APPROVED' | 'NEEDS_CHANGES'
  revisionNumber: number
  attachment?: ThreadAttachment
  comments: ApprovalCommentItem[]
}

type ApiApprovalItem = {
  id: string
  requestId: string
  sentMessageId: string | null
  title: string
  status: 'PENDING' | 'APPROVED' | 'NEEDS_CHANGES'
  revisionNumber: number
  attachmentId: string
  fileName: string
  mimeType: string
  createdAt: string
  attachment?: ThreadAttachment
  comments?: ApprovalCommentItem[]
}

export function mapThreadApprovalItemsFromApi(items: ApiApprovalItem[]): ThreadApprovalItem[] {
  return items.map((item) => ({
    id: item.id,
    requestId: item.requestId,
    messageId: item.sentMessageId ?? '',
    title: item.title,
    status: item.status,
    revisionNumber: item.revisionNumber,
    attachment:
      item.attachment ??
      (item.attachmentId && item.fileName && item.mimeType
        ? {
            id: item.attachmentId,
            fileName: item.fileName,
            mimeType: item.mimeType,
            createdAt: item.createdAt,
          }
        : undefined),
    comments: item.comments ?? [],
  }))
}
