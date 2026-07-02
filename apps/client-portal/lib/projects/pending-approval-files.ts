import {
  approvalItemsForMessage,
  nonApprovalMessageAttachments as nonApprovalMessageAttachmentsBase,
} from '@cocreate/app-ui/thread-approval-match'
import type { PendingApprovalFileItem } from '@/lib/projects/api-types'
import type { ThreadAttachment } from '@/lib/projects/thread-content'

export type PendingApprovalFile = {
  key: string
  approvalItemId: string
  requestId: string
  projectId: string
  messageId: string
  projectTitle: string | null
  checkpointTitle: string
  checkpointBody: string
  revisionNumber: number
  status?: 'PENDING' | 'NEEDS_CHANGES' | 'APPROVED'
  attachment?: ThreadAttachment
}

export function pendingApprovalFileKey(approvalItemId: string): string {
  return approvalItemId
}

export function mapPendingApprovalFilesFromApi(
  files: PendingApprovalFileItem[],
): PendingApprovalFile[] {
  return files.map((file) => {
    const approvalItemId = file.approvalItemId ?? file.id ?? ''
    return {
      key: pendingApprovalFileKey(approvalItemId),
      approvalItemId,
      requestId: file.requestId,
      projectId: file.projectId,
      messageId: file.messageId,
      projectTitle: file.projectTitle,
      checkpointTitle: file.checkpointTitle,
      checkpointBody: file.checkpointBody,
      revisionNumber: file.revisionNumber ?? 1,
      status: file.status,
      attachment:
        file.attachmentId && file.fileName && file.mimeType
          ? {
              id: file.attachmentId,
              fileName: file.fileName,
              mimeType: file.mimeType,
              createdAt: file.createdAt,
            }
          : undefined,
    }
  })
}

export function findPendingApprovalFile(
  files: PendingApprovalFile[],
  key: string | null | undefined,
): PendingApprovalFile | undefined {
  if (!key) return undefined
  return files.find((file) => file.key === key)
}

export function pendingApprovalFilesForMessage(
  messageId: string,
  requestId: string,
  attachmentIds: string[],
  files: PendingApprovalFile[],
): PendingApprovalFile[] {
  return approvalItemsForMessage(messageId, requestId, attachmentIds, files)
}

export function nonApprovalMessageAttachments(
  attachments: ThreadAttachment[] | undefined,
  pendingFiles: PendingApprovalFile[],
): ThreadAttachment[] {
  return nonApprovalMessageAttachmentsBase(attachments, pendingFiles)
}
