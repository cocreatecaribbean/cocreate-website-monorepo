import { z } from 'zod'
import { isoDateTimeString } from '../../../zod/common'

export const ClientProjectStatusSchema = z.enum([
  'SUBMITTED',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
])
export type ClientProjectStatus = z.infer<typeof ClientProjectStatusSchema>

export const ClientProjectPhaseSchema = z.enum([
  'DISCOVERY',
  'IN_PROGRESS',
  'CLIENT_REVIEW',
  'READY_FOR_DELIVERY',
  'DELIVERED',
])
export type ClientProjectPhase = z.infer<typeof ClientProjectPhaseSchema>

export const ProjectRequestStatusSchema = z.enum([
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'REJECTED',
  'CANCELLED',
])
export type ProjectRequestStatus = z.infer<typeof ProjectRequestStatusSchema>

export const ProjectAttachmentSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  requestId: z.string().nullable(),
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  createdAt: isoDateTimeString,
  clientApprovedAt: isoDateTimeString.nullable().optional(),
})
export type ProjectAttachment = z.infer<typeof ProjectAttachmentSchema>

export const ProjectRequestMessageBaseSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  authorUserId: z.string(),
  authorEmail: z.string().nullable(),
  authorDisplayName: z.string().nullable().optional(),
  authorJobTitle: z.string().nullable().optional(),
  body: z.string(),
  messageKind: z.enum(['CHAT', 'CHECKPOINT']).optional(),
  checkpointTargetPhase: ClientProjectPhaseSchema.nullable().optional(),
  requiresClientApproval: z.boolean().optional(),
  clientApprovedAt: isoDateTimeString.nullable().optional(),
  supersededAt: isoDateTimeString.nullable().optional(),
  isPendingApproval: z.boolean().optional(),
  createdAt: isoDateTimeString,
  attachmentIds: z.array(z.string()).optional(),
  attachments: z.array(ProjectAttachmentSchema).optional(),
})
export type ProjectRequestMessageBase = z.infer<typeof ProjectRequestMessageBaseSchema>

export const ProjectActivitySchema = z.object({
  id: z.string(),
  action: z.string(),
  actorEmail: z.string().nullable(),
  actorName: z.string().nullable(),
  actorJobTitle: z.string().nullable().optional(),
  actorLabel: z.string().nullable().optional(),
  summary: z.string(),
  createdAt: isoDateTimeString,
})
export type ProjectActivity = z.infer<typeof ProjectActivitySchema>

export const ProjectAttachmentWithUsageSchema = ProjectAttachmentSchema.extend({
  usedInThreads: z.boolean(),
  messageRefsCount: z.number(),
  lastUsedAt: isoDateTimeString.nullable(),
  uploadedByUserId: z.string().optional(),
})
export type ProjectAttachmentWithUsage = z.infer<typeof ProjectAttachmentWithUsageSchema>

export const ProjectFilesGroupSchema = z.object({
  projectId: z.string(),
  projectTitle: z.string(),
  libraryUploads: z.array(ProjectAttachmentWithUsageSchema),
  usedInThreads: z.array(ProjectAttachmentWithUsageSchema),
})
export type ProjectFilesGroup = z.infer<typeof ProjectFilesGroupSchema>

export const ClientFilesLibrarySchema = z.object({
  projects: z.array(ProjectFilesGroupSchema),
  files: z
    .array(ProjectAttachmentWithUsageSchema.extend({ projectTitle: z.string() }))
    .optional(),
  nextCursor: z.string().nullable().optional(),
})
export type ClientFilesLibrary = z.infer<typeof ClientFilesLibrarySchema>

export const FilesQueryBaseSchema = z.object({
  projectId: z.string().optional(),
  q: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().optional(),
})
export type FilesQueryBase = z.infer<typeof FilesQueryBaseSchema>
