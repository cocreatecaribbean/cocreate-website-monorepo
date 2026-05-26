import type {
  ClientProject,
  ClientProjectPhase,
  ClientProjectStatus,
  Organization,
  ProjectActivity,
  ProjectAttachment,
  ProjectRequest,
  ProjectRequestMessage,
  ProjectRequestStatus,
  ProjectRequestType,
  ProjectMessageAuthorRole,
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
    'displayName' | 'jobTitle' | 'department' | 'avatarStoragePath'
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
  })[]
  project?: Pick<ClientProject, 'id' | 'title' | 'organizationId'> & {
    organization?: Pick<Organization, 'id' | 'name'>
  }
}

function serializeActorFields(user: UserActorPick | null | undefined, role: 'ADMIN' | 'CLIENT') {
  const fallback = role === 'ADMIN' ? 'CoCreate team' : 'Client'
  return {
    displayName: resolveActorDisplayName(user, fallback),
    jobTitle: resolveActorJobTitle(user),
    label: resolveActorLabel(user, { includeTitle: true, fallback }),
  }
}

export function serializeMessage(
  message: ProjectRequestMessage & { author?: UserWithProfile },
) {
  const role = message.authorRole as ProjectMessageAuthorRole
  const actor =
    role === 'ADMIN'
      ? serializeActorFields(message.author, 'ADMIN')
      : serializeActorFields(message.author, 'CLIENT')

  return {
    id: message.id,
    requestId: message.requestId,
    authorUserId: message.authorUserId,
    authorEmail: message.author?.email ?? null,
    authorDisplayName: actor.displayName,
    authorJobTitle: actor.jobTitle,
    authorRole: role,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
  }
}

type ProjectWithReviewMeta = ProjectWithRelations & {
  openAdminReviewCount?: number
}

export function serializeProject(project: ProjectWithReviewMeta) {
  const openAdminReviewCount =
    project.openAdminReviewCount ??
    project.requests?.filter(
      (r) =>
        r.type === 'ADMIN_REVIEW' &&
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
    openAdminReviewCount,
    hasOpenAdminReview: openAdminReviewCount > 0,
    requests:
      project.requests?.every((r) => 'title' in r && r.title !== undefined)
        ? project.requests.map((r) => serializeRequest(r as RequestWithRelations))
        : undefined,
    attachments: project.attachments?.map(serializeAttachment) ?? undefined,
    activities: project.activities?.map(serializeActivity) ?? undefined,
  }
}

export function serializeRequest(request: RequestWithRelations) {
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
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    attachments: request.attachments?.map(serializeAttachment),
    messages: request.messages?.map(serializeMessage),
    messageCount: request.messages?.length ?? 0,
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
