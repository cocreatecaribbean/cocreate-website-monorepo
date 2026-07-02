import type { ClientProjectSummary as AdminClientProjectSummary } from '@cocreate/api-contracts/v1/admin-portal'
import type {
  ClientApprovalRecord,
  ClientProject,
  ClientProjectPhase,
  ClientProjectStatus,
  CancellationOutcome,
  Organization,
  ProjectActivity,
  ProjectAttachment,
  ProjectRequest,
  ProjectRequestMessage,
  ProjectRequestStatus,
  ProjectRequestType,
  ProjectMessageAuthorRole,
  ProjectMessageKind,
  PortalNotification,
  User,
  UserProfile,
} from '@cocreate/database'
import { getActivitySummary, getClientProjectStatusLabel } from './project-labels'
import {
  resolveActorDisplayName,
  resolveActorJobTitle,
  resolveActorLabel,
  type UserActorPick,
} from '../users/display-name'

type UserWithProfile = Pick<User, 'id' | 'email'> & {
  profile?: Pick<
    UserProfile,
    'displayName' | 'jobTitle' | 'avatarStoragePath'
  > | null
}

type ProjectWithRelations = ClientProject & {
  organization?: Pick<Organization, 'id' | 'name' | 'slug'>
  createdBy?: UserWithProfile
  approvedBy?: UserWithProfile | null
  completedBy?: UserWithProfile | null
  requests?: Array<
    Pick<ProjectRequest, 'id' | 'type' | 'status'> & Partial<ProjectRequest>
  >
  attachments?: ProjectAttachment[]
  activities?: (ProjectActivity & { actor?: UserWithProfile })[]
}

type RequestWithRelations = ProjectRequest & {
  createdBy?: UserWithProfile
  resolvedBy?: UserWithProfile | null
  attachments?: ProjectAttachment[]
  messages?: (ProjectRequestMessage & {
    author?: UserWithProfile
    attachmentLinks?: Array<{
      attachment: ProjectAttachment
    }>
  })[]
  project?: Pick<ClientProject, 'id' | 'title' | 'organizationId'> & {
    organization?: Pick<Organization, 'id' | 'name'>
  }
}

type PendingCheckpointMessagePick = Pick<
  ProjectRequestMessage,
  'messageKind' | 'requiresClientApproval' | 'supersededAt' | 'clientApprovedAt'
>

export function isPendingCheckpointMessage(message: PendingCheckpointMessagePick): boolean {
  return (
    message.messageKind === 'CHECKPOINT' &&
    message.requiresClientApproval &&
    !message.supersededAt &&
    !message.clientApprovedAt
  )
}

export function countPendingCheckpointMessages(
  project: ProjectWithReviewMeta,
): number {
  if (project.pendingCheckpointCount != null) {
    return project.pendingCheckpointCount
  }
  if (!project.requests?.length) return 0

  return project.requests.reduce((sum, request) => {
    const messages =
      'messages' in request && Array.isArray(request.messages)
        ? request.messages
        : null
    if (!messages?.length) return sum
    return sum + messages.filter(isPendingCheckpointMessage).length
  }, 0)
}

export function serializeActorFields(user: UserActorPick | null | undefined, role: 'ADMIN' | 'CLIENT') {
  const fallback = role === 'ADMIN' ? 'CoCreate team' : 'Client'
  return {
    displayName: resolveActorDisplayName(user, fallback),
    jobTitle: resolveActorJobTitle(user),
    label: resolveActorLabel(user, { includeTitle: true, fallback }),
  }
}

export function serializeMessage(
  message: ProjectRequestMessage & {
    author?: UserWithProfile
    attachmentLinks?: Array<{
      clientApprovedAt?: Date | null
      attachment: ProjectAttachment
    }>
  },
  options?: { omitStoragePath?: boolean },
) {
  const serializeAtt = options?.omitStoragePath
    ? serializeAttachmentForPortal
    : serializeAttachment
  const role = message.authorRole as ProjectMessageAuthorRole
  const actor =
    role === 'ADMIN'
      ? serializeActorFields(message.author, 'ADMIN')
      : role === 'COLLABORATOR'
        ? serializeActorFields(message.author, 'ADMIN')
        : serializeActorFields(message.author, 'CLIENT')

  const pendingApproval = isPendingCheckpointMessage(message)

  return {
    id: message.id,
    requestId: message.requestId,
    authorUserId: message.authorUserId,
    authorEmail: message.author?.email ?? null,
    authorDisplayName: actor.displayName,
    authorJobTitle: actor.jobTitle,
    authorRole: role,
    body: message.body,
    messageKind: message.messageKind as ProjectMessageKind,
    checkpointTargetPhase: message.checkpointTargetPhase as ClientProjectPhase | null,
    requiresClientApproval: message.requiresClientApproval,
    clientApprovedAt: message.clientApprovedAt?.toISOString() ?? null,
    supersededAt: message.supersededAt?.toISOString() ?? null,
    isPendingApproval: pendingApproval,
    createdAt: message.createdAt.toISOString(),
    attachmentIds:
      message.attachmentLinks?.map((link) => link.attachment.id) ?? [],
    attachments:
      message.attachmentLinks?.map((link) => ({
        ...serializeAtt(link.attachment),
        clientApprovedAt: link.clientApprovedAt?.toISOString() ?? null,
      })) ?? [],
  }
}

export function serializeAttachmentWithUsage(
  attachment: ProjectAttachment & {
    messageLinks?: Array<{ createdAt: Date }>
  },
) {
  const messageRefsCount = attachment.messageLinks?.length ?? 0
  const lastUsedAt =
    attachment.messageLinks?.length
      ? attachment.messageLinks
          .map((link) => link.createdAt.getTime())
          .reduce((max, value) => Math.max(max, value), 0)
      : null

  return {
    ...serializeAttachment(attachment),
    usedInThreads: messageRefsCount > 0,
    messageRefsCount,
    lastUsedAt: lastUsedAt ? new Date(lastUsedAt).toISOString() : null,
  }
}

export type ProjectFilesGroup = {
  projectId: string
  projectTitle: string
  libraryUploads: ReturnType<typeof serializeAttachmentWithUsage>[]
  usedInThreads: ReturnType<typeof serializeAttachmentWithUsage>[]
}

type ProjectWithReviewMeta = ProjectWithRelations & {
  pendingCheckpointCount?: number
  pendingApprovalItemCount?: number
  approvalItems?: Array<{ id: string }>
  openCancellationCount?: number
}

export function countPendingApprovalItems(project: ProjectWithReviewMeta): number {
  if (project.pendingApprovalItemCount != null) {
    return project.pendingApprovalItemCount
  }
  if (project.approvalItems?.length != null) {
    return project.approvalItems.length
  }
  return countPendingCheckpointMessages(project)
}

export function serializeProject(project: ProjectWithReviewMeta) {
  const pendingCheckpointCount = countPendingApprovalItems(project)

  const openCancellationCount =
    project.openCancellationCount ??
    project.requests?.filter(
      (r) =>
        r.type === 'CANCELLATION' &&
        (r.status === 'OPEN' || r.status === 'IN_PROGRESS'),
    ).length ??
    0

  const approved = serializeActorFields(project.approvedBy ?? undefined, 'ADMIN')
  const completed = serializeActorFields(project.completedBy ?? undefined, 'ADMIN')

  return {
    id: project.id,
    organizationId: project.organizationId,
    organizationName: project.organization?.name ?? null,
    title: project.title,
    description: project.description,
    status: project.status as ClientProjectStatus,
    statusLabel: getClientProjectStatusLabel(project.status as ClientProjectStatus),
    phase: project.phase as ClientProjectPhase,
    createdByUserId: project.createdByUserId,
    createdByEmail: project.createdBy?.email ?? null,
    approvedByUserId: project.approvedByUserId,
    approvedByEmail: project.approvedBy?.email ?? null,
    approvedByName: approved.displayName,
    approvedByJobTitle: approved.jobTitle,
    approvedAt: project.approvedAt?.toISOString() ?? null,
    completedByUserId: project.completedByUserId,
    completedByEmail: project.completedBy?.email ?? null,
    completedByName: completed.displayName,
    completedByJobTitle: completed.jobTitle,
    completedAt: project.completedAt?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    pendingCheckpointCount,
    hasPendingCheckpoint: pendingCheckpointCount > 0,
    openCancellationCount,
    hasOpenCancellation: openCancellationCount > 0,
    /** @deprecated use hasPendingCheckpoint */
    openAdminReviewCount: pendingCheckpointCount,
    /** @deprecated use hasPendingCheckpoint */
    hasOpenAdminReview: pendingCheckpointCount > 0,
    requests:
      project.requests?.every((r) => 'title' in r && r.title !== undefined)
        ? project.requests.map((r) => serializeRequest(r as RequestWithRelations))
        : undefined,
    attachments: project.attachments?.map(serializeAttachment) ?? undefined,
    activities: project.activities?.map(serializeActivity) ?? undefined,
  } satisfies Omit<AdminClientProjectSummary, 'activities' | 'requests' | 'attachments'> & {
    createdByUserId: string | null
    approvedByUserId: string | null
    completedByUserId: string | null
    requests?: ReturnType<typeof serializeRequest>[]
    attachments?: ReturnType<typeof serializeAttachment>[]
    activities?: ReturnType<typeof serializeActivity>[]
  }
}

function isFullThreadMessage(
  message: unknown,
): message is ProjectRequestMessage & {
  author?: UserWithProfile
  attachmentLinks?: Array<{ attachment: ProjectAttachment }>
  createdAt: Date
} {
  return (
    typeof message === 'object' &&
    message !== null &&
    'createdAt' in message &&
    message.createdAt instanceof Date
  )
}

export function serializeRequest(
  request: RequestWithRelations,
  options?: { omitStoragePath?: boolean },
) {
  const fullMessages = request.messages?.filter(isFullThreadMessage) ?? []
  const serializeAtt = options?.omitStoragePath
    ? serializeAttachmentForPortal
    : serializeAttachment

  return {
    id: request.id,
    projectId: request.projectId,
    projectTitle: request.project?.title ?? null,
    organizationId: request.project?.organizationId ?? null,
    organizationName: request.project?.organization?.name ?? null,
    type: request.type as ProjectRequestType,
    status: request.status as ProjectRequestStatus,
    title: request.title,
    description: request.description,
    targetPhase: request.targetPhase as ClientProjectPhase | null,
    createdByUserId: request.createdByUserId,
    createdByEmail: request.createdBy?.email ?? null,
    resolvedByUserId: request.resolvedByUserId,
    resolvedAt: request.resolvedAt?.toISOString() ?? null,
    cancellationOutcome: (request.cancellationOutcome as CancellationOutcome | null) ?? null,
    cancellationFeeAmount:
      request.cancellationFeeAmount != null
        ? Number(request.cancellationFeeAmount)
        : null,
    cancellationFeeNotes: request.cancellationFeeNotes ?? null,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    attachments: request.attachments?.map(serializeAtt),
    messages: fullMessages.length
      ? fullMessages.map((message) => serializeMessage(message, options))
      : undefined,
    messageCount: fullMessages.length,
  }
}

export function serializeAttachment(attachment: ProjectAttachment) {
  return {
    id: attachment.id,
    projectId: attachment.projectId,
    requestId: attachment.requestId,
    storagePath: attachment.storagePath,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    uploadedByUserId: attachment.uploadedByUserId,
    createdAt: attachment.createdAt.toISOString(),
  }
}

export function serializeAttachmentForPortal(attachment: ProjectAttachment) {
  return {
    id: attachment.id,
    projectId: attachment.projectId,
    requestId: attachment.requestId,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    uploadedByUserId: attachment.uploadedByUserId,
    createdAt: attachment.createdAt.toISOString(),
  }
}

export function serializeActivity(
  activity: ProjectActivity & { actor?: UserWithProfile },
) {
  const actorEmail = activity.actor?.email ?? null
  const actorFields = serializeActorFields(activity.actor, 'ADMIN')
  const metadata =
    activity.metadata && typeof activity.metadata === 'object' && !Array.isArray(activity.metadata)
      ? (activity.metadata as Record<string, unknown>)
      : null

  return {
    id: activity.id,
    projectId: activity.projectId,
    action: activity.action,
    actorUserId: activity.actorUserId,
    actorEmail,
    actorName: actorFields.displayName,
    actorJobTitle: actorFields.jobTitle,
    actorLabel: actorFields.label,
    summary: getActivitySummary(
      activity.action,
      actorFields.displayName,
      metadata,
    ),
    metadata: activity.metadata,
    createdAt: activity.createdAt.toISOString(),
  }
}

export function serializeApprovalRecord(
  record: ClientApprovalRecord & {
    attachmentIds?: string[]
    approvedAttachmentId?: string | null
    snapshottedAttachments?: ProjectAttachment[]
    approvalItem?: { attachment: ProjectAttachment } | null
    message?: {
      id?: string
      createdAt?: Date
      attachmentLinks?: Array<{ attachment: ProjectAttachment }>
    } | null
  },
  options?: { omitStoragePath?: boolean },
) {
  return {
    id: record.id,
    projectId: record.projectId,
    requestId: record.requestId,
    messageId: record.messageId ?? '',
    approvalItemId: record.approvalItemId ?? null,
    title: record.title,
    summary: record.summary,
    targetPhase: record.targetPhase as ClientProjectPhase | null,
    approvedAt: record.approvedAt.toISOString(),
    approvedByUserId: record.approvedByUserId,
    attachments: resolveApprovalRecordAttachments(record, options),
  }
}

export function serializePendingApprovalFiles(
  messages: Array<{
    id: string
    body: string
    createdAt: Date
    attachmentLinks: Array<{
      clientApprovedAt?: Date | null
      attachment: ProjectAttachment
    }>
    request: {
      id: string
      title: string
      projectId: string
      project: { title: string }
    }
  }>,
) {
  const files: Array<{
    attachmentId: string | null
    fileName: string | null
    mimeType: string | null
    sizeBytes: number | null
    createdAt: string
    requestId: string
    messageId: string
    projectId: string
    projectTitle: string
    checkpointTitle: string
    checkpointBody: string
  }> = []

  for (const message of messages) {
    const base = {
      requestId: message.request.id,
      messageId: message.id,
      projectId: message.request.projectId,
      projectTitle: message.request.project.title,
      checkpointTitle: message.request.title,
      checkpointBody: message.body,
    }

    const pendingLinks = message.attachmentLinks.filter(
      (link) => !link.clientApprovedAt,
    )

    if (pendingLinks.length === 0) {
      if (message.attachmentLinks.length === 0) {
        files.push({
          ...base,
          attachmentId: null,
          fileName: null,
          mimeType: null,
          sizeBytes: null,
          createdAt: message.createdAt.toISOString(),
        })
      }
      continue
    }

    for (const link of pendingLinks) {
      const attachment = link.attachment
      files.push({
        ...base,
        attachmentId: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        createdAt: attachment.createdAt.toISOString(),
      })
    }
  }

  return files
}

function resolveApprovalRecordAttachments(
  record: Parameters<typeof serializeApprovalRecord>[0],
  options?: { omitStoragePath?: boolean },
) {
  const serializeAtt = options?.omitStoragePath
    ? serializeAttachmentForPortal
    : serializeAttachment

  const snapshottedById = new Map(
    (record.snapshottedAttachments ?? []).map((attachment) => [attachment.id, attachment]),
  )

  if (record.attachmentIds?.length) {
    const snapshotted = record.attachmentIds
      .map((id) => snapshottedById.get(id))
      .filter((attachment): attachment is ProjectAttachment => Boolean(attachment))
    if (snapshotted.length > 0) {
      return snapshotted.map(serializeAtt)
    }
  }

  if (record.approvedAttachmentId) {
    const approvalItemAttachment =
      record.approvalItem?.attachment?.id === record.approvedAttachmentId
        ? record.approvalItem.attachment
        : undefined
    const approved =
      snapshottedById.get(record.approvedAttachmentId) ?? approvalItemAttachment
    if (approved) {
      return [serializeAtt(approved)]
    }
  }

  if (record.approvalItem?.attachment) {
    return [serializeAtt(record.approvalItem.attachment)]
  }

  const fromMessageLinks = resolveMessageLinkAttachments(record, serializeAtt)
  if (fromMessageLinks.length > 0) {
    return fromMessageLinks
  }

  return []
}

function resolveMessageLinkAttachments(
  record: Parameters<typeof serializeApprovalRecord>[0],
  serializeAtt: (attachment: ProjectAttachment) => ReturnType<typeof serializeAttachmentForPortal>,
) {
  const links = record.message?.attachmentLinks ?? []
  if (links.length === 0) return []

  if (record.approvedAttachmentId) {
    const filtered = links.filter(
      (link) => link.attachment.id === record.approvedAttachmentId,
    )
    if (filtered.length > 0) {
      return filtered.map((link) => serializeAtt(link.attachment))
    }
  }

  return links.map((link) => serializeAtt(link.attachment))
}

export function serializeNotification(notification: PortalNotification) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    href: notification.href,
    readAt: notification.readAt?.toISOString() ?? null,
    projectId: notification.projectId,
    requestId: notification.requestId,
    organizationId: notification.organizationId,
    createdAt: notification.createdAt.toISOString(),
  }
}
