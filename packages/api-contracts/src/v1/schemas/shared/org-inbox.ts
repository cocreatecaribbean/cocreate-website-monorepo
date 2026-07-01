import { z } from 'zod'
import { isoDateTimeString } from '../../../zod/common'

export const OrgInboxVisibilitySchema = z.enum(['ORG_WIDE', 'RESTRICTED'])
export type OrgInboxVisibility = z.infer<typeof OrgInboxVisibilitySchema>

export const OrgInboxAuthorRoleSchema = z.enum(['CLIENT', 'ADMIN'])
export type OrgInboxAuthorRole = z.infer<typeof OrgInboxAuthorRoleSchema>

export const OrgInboxConversationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  organizationName: z.string().optional(),
  visibility: OrgInboxVisibilitySchema,
  subject: z.string().nullable(),
  createdByUserId: z.string(),
  createdByEmail: z.string().optional(),
  createdAt: isoDateTimeString,
  updatedAt: isoDateTimeString,
  lastMessagePreview: z.string().nullable().optional(),
  unreadCount: z.number().optional(),
})
export type OrgInboxConversation = z.infer<typeof OrgInboxConversationSchema>

export const OrgInboxMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  authorUserId: z.string(),
  authorEmail: z.string(),
  authorRole: OrgInboxAuthorRoleSchema,
  body: z.string(),
  createdAt: isoDateTimeString,
})
export type OrgInboxMessage = z.infer<typeof OrgInboxMessageSchema>

export const OrgInboxConversationListResponseSchema = z.object({
  ok: z.literal(true),
  conversations: z.array(OrgInboxConversationSchema),
})
export type OrgInboxConversationListResponse = z.infer<
  typeof OrgInboxConversationListResponseSchema
>

export const OrgInboxMessageListResponseSchema = z.object({
  ok: z.literal(true),
  messages: z.array(OrgInboxMessageSchema),
})
export type OrgInboxMessageListResponse = z.infer<typeof OrgInboxMessageListResponseSchema>

export const OrgInboxSendMessageResponseSchema = z.object({
  ok: z.literal(true),
  message: OrgInboxMessageSchema,
})
export type OrgInboxSendMessageResponse = z.infer<typeof OrgInboxSendMessageResponseSchema>

export const OrgInboxCreateConversationResponseSchema = z.object({
  ok: z.literal(true),
  conversation: OrgInboxConversationSchema,
})
export type OrgInboxCreateConversationResponse = z.infer<
  typeof OrgInboxCreateConversationResponseSchema
>

export const OrgInboxUnreadCountResponseSchema = z.object({
  unreadCount: z.number(),
})
export type OrgInboxUnreadCountResponse = z.infer<typeof OrgInboxUnreadCountResponseSchema>

export const OrgInboxRealtimeAuthResponseSchema = z.object({
  enabled: z.boolean(),
  channel: z.string().nullable(),
})
export type OrgInboxRealtimeAuthResponse = z.infer<typeof OrgInboxRealtimeAuthResponseSchema>
