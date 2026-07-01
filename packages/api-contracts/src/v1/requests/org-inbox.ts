import { z } from 'zod'
import { OrgInboxVisibilitySchema } from '../schemas/shared/org-inbox'

export const CreateOrgInboxConversationSchema = z.object({
  visibility: OrgInboxVisibilitySchema.default('RESTRICTED'),
  subject: z.string().trim().min(1).max(200).optional(),
  participantUserIds: z.array(z.string()).min(1).optional(),
})
export type CreateOrgInboxConversationInput = z.infer<
  typeof CreateOrgInboxConversationSchema
>

export const SendOrgInboxMessageSchema = z.object({
  body: z.string().trim().min(1).max(10000),
})
export type SendOrgInboxMessageInput = z.infer<typeof SendOrgInboxMessageSchema>
