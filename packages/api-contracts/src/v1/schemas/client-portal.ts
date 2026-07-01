import { z } from 'zod'
import { isoDateTimeString } from '../../zod/common'
import {
  ClientOrgRoleSchema,
  ClientProjectAccessLevelSchema,
  SocialListeningBillingSourceSchema,
  SocialListeningPlanSchema,
  SocialListeningSubscriptionStatusSchema,
} from '../../zod/enums'
import type { ClientOrgRole, ClientProjectAccessLevel } from '../../zod/enums'
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
import {
  AssignableProjectMemberSchema,
  ClientTeamMemberSchema,
  OrgTeamListResponseSchema,
  ProjectMemberMutationResponseSchema,
  ProjectMemberSchema,
  ProjectMembersResponseSchema,
  ProjectTeamCardSchema,
  TeamHubPermissionsSchema,
  TeamHubResponseSchema,
  TeamInviteMemberResponseSchema,
  TeamInviteRequestMutationResponseSchema,
  TeamInviteRequestSchema,
  TeamMemberMutationResponseSchema,
} from './shared/team'

export const ProjectRequestTypeSchema = z.enum([
  'ONBOARDING',
  'PROGRESS',
  'CANCELLATION',
])
export type ProjectRequestType = z.infer<typeof ProjectRequestTypeSchema>

export const ProjectRequestMessageSchema = ProjectRequestMessageBaseSchema.extend({
  authorRole: z.enum(['ADMIN', 'CLIENT', 'COLLABORATOR']),
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
  attachments: z.array(ProjectAttachmentSchema).optional(),
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

export const PortalProfileUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  status: z.string(),
  role: z.string(),
  clientOrgRole: ClientOrgRoleSchema.nullable(),
  canAccessSocialListening: z.boolean(),
})
export type PortalProfileUser = z.infer<typeof PortalProfileUserSchema>

export const PortalProfileOrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().nullable(),
  isSocialListeningSubscriber: z.boolean(),
})
export type PortalProfileOrganization = z.infer<typeof PortalProfileOrganizationSchema>

export const PortalPermissionsSchema = z.object({
  canManageOrgTeam: z.boolean(),
  canAccessTeamHub: z.boolean(),
  canManageOrgRoles: z.boolean(),
  canInviteOrgMemberImmediately: z.boolean(),
  canRequestOrgInvite: z.boolean(),
  canToggleSocialListeningForTeam: z.boolean(),
  canCreateProject: z.boolean(),
  canUseSocialListening: z.boolean(),
})
export type PortalPermissions = z.infer<typeof PortalPermissionsSchema>

export const PortalProfilePayloadSchema = z.object({
  user: PortalProfileUserSchema,
  organization: PortalProfileOrganizationSchema.nullable(),
  permissions: PortalPermissionsSchema,
})
export type PortalProfilePayload = z.infer<typeof PortalProfilePayloadSchema>

export const PortalProfileResponseSchema = PortalProfilePayloadSchema.extend({
  ok: z.literal(true),
})
export type PortalProfileResponse = z.infer<typeof PortalProfileResponseSchema>

/** Alias for client fetch helpers */
export type PortalProfile = PortalProfilePayload

export const ClientRecentActivityItemSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  projectTitle: z.string(),
  action: z.string(),
  summary: z.string().optional(),
  actorEmail: z.string().nullable(),
  actorName: z.string().nullable().optional(),
  actorLabel: z.string().nullable().optional(),
  createdAt: isoDateTimeString,
  href: z.string(),
})
export type ClientRecentActivityItem = z.infer<typeof ClientRecentActivityItemSchema>

export const ClientSubscriptionPaymentMethodSchema = z.object({
  last4: z.string(),
  brand: z.string().nullable(),
  expMonth: z.number().nullable(),
  expYear: z.number().nullable(),
})

export const ClientSubscriptionViewSchema = z.object({
  plan: SocialListeningPlanSchema,
  planId: z.string().nullable(),
  planName: z.string(),
  status: SocialListeningSubscriptionStatusSchema,
  startedAt: isoDateTimeString.nullable(),
  currentPeriodEnd: isoDateTimeString.nullable(),
  autoRenewEnabled: z.boolean(),
  cancelAtPeriodEnd: z.boolean(),
  billingSource: SocialListeningBillingSourceSchema,
  entitled: z.boolean(),
  paymentMethod: ClientSubscriptionPaymentMethodSchema.nullable(),
})
export type ClientSubscriptionView = z.infer<typeof ClientSubscriptionViewSchema>

export const ClientSubscriptionResponseSchema = z.object({
  subscription: ClientSubscriptionViewSchema.nullable(),
})
export type ClientSubscriptionResponse = z.infer<typeof ClientSubscriptionResponseSchema>

export {
  AssignableProjectMemberSchema,
  ClientTeamMemberSchema,
  OrgTeamListResponseSchema,
  ProjectMemberMutationResponseSchema,
  ProjectMemberSchema,
  ProjectMembersResponseSchema,
  ProjectTeamCardSchema,
  TeamHubPermissionsSchema,
  TeamHubResponseSchema,
  TeamInviteMemberResponseSchema,
  TeamInviteRequestMutationResponseSchema,
  TeamInviteRequestSchema,
  TeamMemberMutationResponseSchema,
} from './shared/team'
import type { ClientTeamMember, TeamHubResponse } from './shared/team'

export type {
  AssignableProjectMember,
  ClientTeamMember,
  OrgTeamListResponse,
  ProjectMember,
  ProjectMemberMutationResponse,
  ProjectMembersResponse,
  ProjectTeamCard,
  TeamHubPermissions,
  TeamHubResponse,
  TeamInviteMemberResponse,
  TeamInviteRequest,
  TeamInviteRequestMutationResponse,
  TeamMemberMutationResponse,
} from './shared/team'

/** Client portal team member alias */
export type TeamMember = ClientTeamMember

/** Team hub page payload */
export type TeamHub = TeamHubResponse

export type { ClientOrgRole, ClientProjectAccessLevel }
export { ClientOrgRoleSchema, ClientProjectAccessLevelSchema }

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

export {
  OrgInboxAuthorRoleSchema,
  OrgInboxConversationListResponseSchema,
  OrgInboxConversationSchema,
  OrgInboxCreateConversationResponseSchema,
  OrgInboxMessageListResponseSchema,
  OrgInboxMessageSchema,
  OrgInboxRealtimeAuthResponseSchema,
  OrgInboxSendMessageResponseSchema,
  OrgInboxUnreadCountResponseSchema,
  OrgInboxVisibilitySchema,
} from './shared/org-inbox'

export type {
  OrgInboxAuthorRole,
  OrgInboxConversation,
  OrgInboxConversationListResponse,
  OrgInboxCreateConversationResponse,
  OrgInboxMessage,
  OrgInboxMessageListResponse,
  OrgInboxRealtimeAuthResponse,
  OrgInboxSendMessageResponse,
  OrgInboxUnreadCountResponse,
  OrgInboxVisibility,
} from './shared/org-inbox'
