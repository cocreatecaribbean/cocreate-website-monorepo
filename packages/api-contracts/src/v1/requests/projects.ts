import { z } from 'zod'
import { emailString, isoDateString, uuidString } from '../../zod/common'
import {
  CancellationOutcomeSchema,
  ClientOrgRoleSchema,
  ProjectAttachmentVisibilitySchema,
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
  title: z.string().min(2).max(200).optional(),
  status: ClientProjectStatusSchema.optional(),
  phase: ClientProjectPhaseSchema.optional(),
})
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>

export const RenameProjectSchema = z.object({
  title: z.string().min(2).max(200),
})
export type RenameProjectInput = z.infer<typeof RenameProjectSchema>

export const CreateChangeRequestSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(1).max(10000),
})
export type CreateChangeRequestInput = z.infer<typeof CreateChangeRequestSchema>

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

export const CreateRequestMessageSchema = z
  .object({
    body: z.string().max(10000),
    attachmentIds: z.array(z.string()).optional(),
    /** When true with attachments on a client-visible thread, mark files for approval. */
    requestApproval: z.boolean().optional(),
  })
  .refine(
    (data) => data.body.trim().length > 0 || (data.attachmentIds?.length ?? 0) > 0,
    { message: 'Message must include text or at least one attachment' },
  )
export type CreateRequestMessageInput = z.infer<typeof CreateRequestMessageSchema>

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

export const StagedAttachmentSchema = UploadUrlSchema.extend({
  storagePath: z.string().min(1).max(512),
})
export type StagedAttachmentInput = z.infer<typeof StagedAttachmentSchema>

export const RegisterAttachmentSchema = UploadUrlSchema.extend({
  storagePath: z.string().min(1).max(512),
  requestId: z.string().optional(),
  visibility: ProjectAttachmentVisibilitySchema.optional(),
})
export type RegisterAttachmentInput = z.infer<typeof RegisterAttachmentSchema>

export const SetFileReactionSchema = z.object({
  kind: z.enum([
    'LOVE_THIS',
    'SHIP_IT',
    'GREAT_DIRECTION',
    'ANOTHER_VERSION',
    'NEEDS_A_TWEAK',
  ]),
})
export type SetFileReactionInput = z.infer<typeof SetFileReactionSchema>

export const TopPicksQuerySchema = z.object({
  tags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => {
      if (!value) return [] as string[]
      const raw = Array.isArray(value) ? value : value.split(',')
      return raw.map((tag) => tag.trim()).filter(Boolean)
    }),
})
export type TopPicksQuery = z.infer<typeof TopPicksQuerySchema>

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
  canAccessGetHelp: z.boolean().optional(),
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
  canAccessGetHelp: z.boolean().optional(),
})
export type UpdateTeamMemberInput = z.infer<typeof UpdateTeamMemberSchema>

export const AddProjectMemberSchema = z.object({
  email: emailString,
})
export type AddProjectMemberInput = z.infer<typeof AddProjectMemberSchema>

export const TransferProjectOwnershipSchema = z.object({
  newOwnerUserId: uuidString,
})
export type TransferProjectOwnershipInput = z.infer<
  typeof TransferProjectOwnershipSchema
>

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

export const UpdateCollaboratorProjectsSchema = z.object({
  projectIds: z.array(z.string()),
})
export type UpdateCollaboratorProjectsInput = z.infer<
  typeof UpdateCollaboratorProjectsSchema
>

export const RemoveThreadAttachmentQuerySchema = z.object({
  messageId: z.string().min(1),
})
export type RemoveThreadAttachmentQuery = z.infer<
  typeof RemoveThreadAttachmentQuerySchema
>
