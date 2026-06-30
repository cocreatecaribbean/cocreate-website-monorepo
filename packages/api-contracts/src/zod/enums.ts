import { z } from 'zod'

/** Wire enums — keep in sync with Prisma @cocreate/database. */

export const ClientOrgRoleSchema = z.enum(['OWNER', 'PROJECT_MANAGER', 'MEMBER'])
export type ClientOrgRole = z.infer<typeof ClientOrgRoleSchema>

export const ClientProjectAccessLevelSchema = z.enum(['MANAGE', 'VIEW'])
export type ClientProjectAccessLevel = z.infer<typeof ClientProjectAccessLevelSchema>

export const ProjectRequestStatusSchema = z.enum([
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'REJECTED',
  'CANCELLED',
])
export type ProjectRequestStatusWire = z.infer<typeof ProjectRequestStatusSchema>

export const ProjectAttachmentVisibilitySchema = z.enum(['CLIENT', 'INTERNAL'])
export type ProjectAttachmentVisibility = z.infer<typeof ProjectAttachmentVisibilitySchema>

export const CancellationOutcomeSchema = z.enum([
  'APPROVED_NO_FEE',
  'APPROVED_WITH_FEE',
  'DENIED',
])
export type CancellationOutcomeWire = z.infer<typeof CancellationOutcomeSchema>

export const UserRoleSchema = z.enum(['SUPER_ADMIN', 'ADMIN', 'COLLABORATOR', 'CLIENT'])
export type UserRoleWire = z.infer<typeof UserRoleSchema>

export const AdminAssignableRoleSchema = z.enum(['SUPER_ADMIN', 'ADMIN'])

export const SocialListeningPlanSchema = z.enum(['PULSE', 'GROWTH', 'SCALE'])
export const SocialListeningPlanIdSchema = z.enum(['pulse', 'growth', 'scale'])

export const SocialListeningBillingSourceSchema = z.enum([
  'FYGARO',
  'ADMIN_COMP',
  'ADMIN_MANUAL',
])
export type SocialListeningBillingSourceWire = z.infer<
  typeof SocialListeningBillingSourceSchema
>

export const SocialListeningSubscriptionStatusSchema = z.enum([
  'PENDING_PAYMENT',
  'ACTIVE',
  'PAST_DUE',
  'CANCELLED',
  'EXPIRED',
])
export type SocialListeningSubscriptionStatusWire = z.infer<
  typeof SocialListeningSubscriptionStatusSchema
>

export const ListeningPlatformSchema = z.enum([
  'x',
  'tiktok',
  'reddit',
  'instagram',
  'facebook',
  'web',
  'forums',
])

export const ListeningKeywordMatchTypeSchema = z.enum(['broad', 'exact'])
