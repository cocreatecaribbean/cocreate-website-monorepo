import type {
  ProjectApprovalComment,
  ProjectApprovalItem,
  ProjectAttachment,
  ProjectMessageAuthorRole,
} from '@cocreate/database'
import {
  serializeAttachmentForPortal,
  serializeActorFields,
} from './projects.serializer'
import type { UserActorPick } from '../users/display-name'

type ApprovalItemWithRelations = ProjectApprovalItem & {
  attachment: ProjectAttachment
  project?: { id: string; title: string }
  request?: { id: string; title: string }
  comments?: ApprovalCommentWithRelations[]
}

type ApprovalCommentWithRelations = ProjectApprovalComment & {
  author?: UserActorPick
  attachmentLinks?: Array<{ attachment: ProjectAttachment }>
}

export function serializeApprovalItem(
  item: ApprovalItemWithRelations,
  options?: { omitStoragePath?: boolean; includeComments?: boolean },
) {
  const attachment = options?.omitStoragePath
    ? serializeAttachmentForPortal(item.attachment)
    : item.attachment

  const serialized = {
    id: item.id,
    projectId: item.projectId,
    projectTitle: item.project?.title ?? '',
    requestId: item.requestId,
    title: item.title,
    note: item.note ?? null,
    status: item.status,
    revisionNumber: item.revisionNumber,
    sentAt: item.sentAt.toISOString(),
    sentMessageId: item.sentMessageId ?? null,
    decidedAt: item.decidedAt?.toISOString() ?? null,
    attachmentId: item.attachmentId,
    fileName: item.attachment.fileName,
    mimeType: item.attachment.mimeType,
    sizeBytes: item.attachment.sizeBytes,
    createdAt: item.attachment.createdAt.toISOString(),
    attachment,
  }

  if (options?.includeComments && item.comments) {
    return {
      ...serialized,
      comments: item.comments.map((comment) => serializeApprovalComment(comment)),
    }
  }

  return serialized
}

export function serializeApprovalComment(comment: ApprovalCommentWithRelations) {
  const role = comment.authorRole as ProjectMessageAuthorRole
  const actor =
    role === 'CLIENT'
      ? serializeActorFields(comment.author, 'CLIENT')
      : serializeActorFields(comment.author, 'ADMIN')

  return {
    id: comment.id,
    approvalItemId: comment.approvalItemId,
    authorUserId: comment.authorUserId,
    authorRole: role,
    authorDisplayName: actor.displayName,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    attachments:
      comment.attachmentLinks?.map((link) => serializeAttachmentForPortal(link.attachment)) ??
      [],
  }
}
