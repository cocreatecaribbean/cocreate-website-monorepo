import { z } from 'zod'
import { isoDateTimeString } from '../../zod/common'
import {
  ClientFilesLibrarySchema,
  ClientProjectPhaseSchema,
  ClientProjectStatusSchema,
  FilesQueryBaseSchema,
  ProjectActivitySchema,
  ProjectAttachmentSchema,
  ProjectAttachmentWithUsageSchema,
  ProjectFilesGroupSchema,
  ProjectRequestMessageBaseSchema,
  ProjectRequestStatusSchema,
} from './shared/projects'

export const ProjectRequestTypeSchema = z.enum([
  'ONBOARDING',
  'PROGRESS',
  'CANCELLATION',
])
export type ProjectRequestType = z.infer<typeof ProjectRequestTypeSchema>

export const ProjectRequestMessageSchema = ProjectRequestMessageBaseSchema.extend({
  authorRole: z.enum(['ADMIN', 'CLIENT']),
})
export type ProjectRequestMessage = z.infer<typeof ProjectRequestMessageSchema>

export const FilesQuerySchema = FilesQueryBaseSchema
export type FilesQuery = z.infer<typeof FilesQuerySchema>

export const ClientProjectSummarySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  title: z.string(),
  description: z.string(),
  status: ClientProjectStatusSchema,
  statusLabel: z.string().optional(),
  phase: ClientProjectPhaseSchema,
  approvedByEmail: z.string().nullable().optional(),
  approvedByName: z.string().nullable().optional(),
  approvedByJobTitle: z.string().nullable().optional(),
  approvedAt: isoDateTimeString.nullable().optional(),
  completedByEmail: z.string().nullable().optional(),
  completedByName: z.string().nullable().optional(),
  completedByJobTitle: z.string().nullable().optional(),
  completedAt: isoDateTimeString.nullable().optional(),
  createdAt: isoDateTimeString,
  updatedAt: isoDateTimeString,
  coverImageUrl: z.string().nullable().optional(),
  pendingCheckpointCount: z.number().optional(),
  hasPendingCheckpoint: z.boolean().optional(),
  openAdminReviewCount: z.number().optional(),
  hasOpenAdminReview: z.boolean().optional(),
  activities: z.array(ProjectActivitySchema).optional(),
})
export type ClientProjectSummary = z.infer<typeof ClientProjectSummarySchema>

export const ProjectRequestItemSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  projectTitle: z.string().nullable().optional(),
  type: ProjectRequestTypeSchema,
  status: ProjectRequestStatusSchema,
  title: z.string(),
  description: z.string(),
  targetPhase: ClientProjectPhaseSchema.nullable(),
  cancellationOutcome: z.string().nullable().optional(),
  cancellationFeeAmount: z.number().nullable().optional(),
  cancellationFeeNotes: z.string().nullable().optional(),
  createdAt: isoDateTimeString,
  messages: z.array(ProjectRequestMessageSchema).optional(),
  attachments: z.array(ProjectAttachmentSchema).optional(),
  messageCount: z.number().optional(),
})
export type ProjectRequestItem = z.infer<typeof ProjectRequestItemSchema>

export const ClientApprovalRecordItemSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  projectTitle: z.string().optional(),
  requestId: z.string(),
  messageId: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  targetPhase: ClientProjectPhaseSchema.nullable(),
  approvedAt: isoDateTimeString,
})
export type ClientApprovalRecordItem = z.infer<typeof ClientApprovalRecordItemSchema>

export const ClientProjectDetailSchema = ClientProjectSummarySchema.extend({
  requests: z.array(ProjectRequestItemSchema).optional(),
  attachments: z.array(ProjectAttachmentSchema).optional(),
  activities: z.array(ProjectActivitySchema).optional(),
})
export type ClientProjectDetail = z.infer<typeof ClientProjectDetailSchema>

export const ClientDashboardStatsSchema = z.object({
  activeProjects: z.number(),
  activeProjectsAwaitingReview: z.number(),
  pendingApprovals: z.number(),
  sharedFiles: z.number(),
  lastSharedFileAt: isoDateTimeString.nullable(),
})
export type ClientDashboardStats = z.infer<typeof ClientDashboardStatsSchema>

export const PortalNotificationItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  href: z.string().nullable(),
  readAt: isoDateTimeString.nullable(),
  projectId: z.string().nullable(),
  requestId: z.string().nullable(),
  createdAt: isoDateTimeString,
})
export type PortalNotificationItem = z.infer<typeof PortalNotificationItemSchema>

export {
  ClientFilesLibrarySchema,
  ClientProjectPhaseSchema,
  ClientProjectStatusSchema,
  ProjectActivitySchema,
  ProjectAttachmentSchema,
  ProjectAttachmentWithUsageSchema,
  ProjectFilesGroupSchema,
  ProjectRequestStatusSchema,
} from './shared/projects'

export type {
  ClientFilesLibrary,
  ClientProjectPhase,
  ClientProjectStatus,
  ProjectActivity,
  ProjectAttachment,
  ProjectAttachmentWithUsage,
  ProjectFilesGroup,
  ProjectRequestStatus,
} from './shared/projects'
