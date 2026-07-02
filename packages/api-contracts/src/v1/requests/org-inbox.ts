import { z } from 'zod'
import { OrgInboxVisibilitySchema } from '../schemas/shared/org-inbox'
import { UploadUrlSchema } from './projects'

export const CreateOrgInboxConversationSchema = z.object({
  visibility: OrgInboxVisibilitySchema.default('RESTRICTED'),
  subject: z.string().trim().min(1).max(200).optional(),
  participantUserIds: z.array(z.string()).min(1).optional(),
})
export type CreateOrgInboxConversationInput = z.infer<
  typeof CreateOrgInboxConversationSchema
>

export const SendOrgInboxMessageSchema = z
  .object({
    body: z.string().max(10000),
    attachmentIds: z.array(z.string()).optional(),
  })
  .refine(
    (data) => data.body.trim().length > 0 || (data.attachmentIds?.length ?? 0) > 0,
    { message: 'Message must include text or at least one attachment' },
  )
export type SendOrgInboxMessageInput = z.infer<typeof SendOrgInboxMessageSchema>

export const RegisterOrgInboxAttachmentSchema = UploadUrlSchema.extend({
  storagePath: z.string().min(1).max(512),
})
export type RegisterOrgInboxAttachmentInput = z.infer<
  typeof RegisterOrgInboxAttachmentSchema
>
