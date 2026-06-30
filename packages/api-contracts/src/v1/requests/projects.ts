import { z } from 'zod'
import { emailString, isoDateString, uuidString } from '../../zod/common'
import {
  CancellationOutcomeSchema,
  ClientOrgRoleSchema,
  ClientProjectAccessLevelSchema,
  ProjectAttachmentVisibilitySchema,
  ProjectRequestStatusSchema,
} from '../../zod/enums'
import {
  ClientProjectPhaseSchema,
  ClientProjectStatusSchema,
} from '../schemas/shared/projects'

export const CreateProjectSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(1).max(10000),
})
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>

export const UpdateProjectSchema = z.object({
  status: ClientProjectStatusSchema.optional(),
  phase: ClientProjectPhaseSchema.optional(),
})
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>

export const CreateChangeRequestSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(1).max(10000),
})
export type CreateChangeRequestInput = z.infer<typeof CreateChangeRequestSchema>

export const CreateReviewRequestSchema = CreateChangeRequestSchema
export type CreateReviewRequestInput = CreateChangeRequestInput

export const CreateCancellationRequestSchema = z.object({
  reason: z.string().max(8000).optional(),
})
export type CreateCancellationRequestInput = z.infer<
  typeof CreateCancellationRequestSchema
>

export const CreatePhaseApprovalSchema = z.object({
  targetPhase: ClientProjectPhaseSchema,
  description: z.string().min(1).max(10000).optional(),
})
export type CreatePhaseApprovalInput = z.infer<typeof CreatePhaseApprovalSchema>

export const CreateRequestMessageSchema = z.object({
  body: z.string().min(1).max(10000),
  attachmentIds: z.array(z.string()).optional(),
})
export type CreateRequestMessageInput = z.infer<typeof CreateRequestMessageSchema>

export const UpdateRequestSchema = z.object({
  status: ProjectRequestStatusSchema,
})
export type UpdateRequestInput = z.infer<typeof UpdateRequestSchema>

export const ResolveCancellationSchema = z.object({
  outcome: CancellationOutcomeSchema,
  feeAmount: z.number().min(0).optional(),
  feeNotes: z.string().max(4000).optional(),
  message: z.string().max(8000).optional(),
})
export type ResolveCancellationInput = z.infer<typeof ResolveCancellationSchema>

export const UploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(127),
  sizeBytes: z.number().int().min(1).max(104857600),
})
export type UploadUrlInput = z.infer<typeof UploadUrlSchema>

export const StagedCheckpointAttachmentSchema = UploadUrlSchema.extend({
  storagePath: z.string().min(1).max(512),
})
export type StagedCheckpointAttachmentInput = z.infer<
  typeof StagedCheckpointAttachmentSchema
>

export const CreateCheckpointSchema = z.object({
  title: z.string().max(200),
  body: z.string().max(8000),
  reviewUrl: z.string().url().max(2048).optional(),
  targetPhase: ClientProjectPhaseSchema.optional(),
  attachments: z.array(StagedCheckpointAttachmentSchema).optional(),
})
export type CreateCheckpointInput = z.infer<typeof CreateCheckpointSchema>

export const RegisterAttachmentSchema = UploadUrlSchema.extend({
  storagePath: z.string().min(1).max(512),
  requestId: z.string().optional(),
  visibility: ProjectAttachmentVisibilitySchema.optional(),
})
export type RegisterAttachmentInput = z.infer<typeof RegisterAttachmentSchema>

export const RegisterCoverSchema = z.object({
  storagePath: z.string().max(500),
})
export type RegisterCoverInput = z.infer<typeof RegisterCoverSchema>

export const RegisterBrandAssetSchema = UploadUrlSchema.extend({
  storagePath: z.string().min(1).max(512),
})
export type RegisterBrandAssetInput = z.infer<typeof RegisterBrandAssetSchema>

export const InviteTeamMemberSchema = z.object({
  email: emailString,
  clientOrgRole: ClientOrgRoleSchema,
  canAccessSocialListening: z.boolean().optional(),
})
export type InviteTeamMemberInput = z.infer<typeof InviteTeamMemberSchema>

export const RequestTeamInviteSchema = z.object({
  email: emailString,
  clientOrgRole: ClientOrgRoleSchema,
})
export type RequestTeamInviteInput = z.infer<typeof RequestTeamInviteSchema>

export const RejectTeamInviteSchema = z.object({
  rejectionReason: z.string().max(500).optional(),
})
export type RejectTeamInviteInput = z.infer<typeof RejectTeamInviteSchema>

export const UpdateTeamMemberSchema = z.object({
  clientOrgRole: ClientOrgRoleSchema.optional(),
  canAccessSocialListening: z.boolean().optional(),
})
export type UpdateTeamMemberInput = z.infer<typeof UpdateTeamMemberSchema>

export const AddProjectMemberSchema = z.object({
  email: emailString,
  access: ClientProjectAccessLevelSchema,
})
export type AddProjectMemberInput = z.infer<typeof AddProjectMemberSchema>

export const InviteAgencyCollaboratorSchema = z.object({
  email: z.string().email().max(320).optional(),
  userId: z.string().optional(),
})
export type InviteAgencyCollaboratorInput = z.infer<
  typeof InviteAgencyCollaboratorSchema
>

export const CreateAgencyCollaboratorSchema = z.object({
  email: z.string().email().max(320),
  projectIds: z.array(z.string()).optional(),
})
export type CreateAgencyCollaboratorInput = z.infer<
  typeof CreateAgencyCollaboratorSchema
>

export const CreateProjectForAdminSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(1).max(10000),
  recipientUserIds: z.array(uuidString).optional(),
  inviteEmails: z.array(z.string().email().max(320)).optional(),
  contactEmail: z.string().email().max(320).optional(),
})
export type CreateProjectForAdminInput = z.infer<typeof CreateProjectForAdminSchema>

export const MarkAttentionReadSchema = z.object({
  requestId: z.string().optional(),
  projectId: z.string().optional(),
})
export type MarkAttentionReadInput = z.infer<typeof MarkAttentionReadSchema>

export const MarkInboxReadSchema = z.object({
  requestId: z.string().optional(),
})
export type MarkInboxReadInput = z.infer<typeof MarkInboxReadSchema>
