import { z } from 'zod'
import { isoDateTimeString } from '../../zod/common'
import { ClientOrgRoleSchema } from '../../zod/enums'
import { ClientTeamMemberSchema, TeamInviteRequestSchema } from './shared/team'
import type { ClientTeamMember } from './shared/team'
import {
  ClientFilesLibrarySchema,
  ClientProjectPhaseSchema,
  ClientProjectStatusSchema,
  FilesQueryBaseSchema,
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
  'INTERNAL',
])
export type ProjectRequestType = z.infer<typeof ProjectRequestTypeSchema>

export const ProjectRequestMessageSchema = ProjectRequestMessageBaseSchema.extend({
  authorRole: z.enum(['ADMIN', 'CLIENT', 'COLLABORATOR']),
})
export type ProjectRequestMessage = z.infer<typeof ProjectRequestMessageSchema>

export const FilesQuerySchema = FilesQueryBaseSchema.extend({
  visibility: z.enum(['CLIENT', 'INTERNAL']).optional(),
})
export type FilesQuery = z.infer<typeof FilesQuerySchema>

export const ProjectRequestItemSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  projectTitle: z.string().nullable(),
  organizationId: z.string().nullable(),
  organizationName: z.string().nullable(),
  type: ProjectRequestTypeSchema,
  status: ProjectRequestStatusSchema,
  title: z.string(),
  description: z.string(),
  targetPhase: ClientProjectPhaseSchema.nullable(),
  cancellationOutcome: z.string().nullable().optional(),
  cancellationFeeAmount: z.number().nullable().optional(),
  cancellationFeeNotes: z.string().nullable().optional(),
  createdByEmail: z.string().nullable(),
  createdAt: isoDateTimeString,
  messages: z.array(ProjectRequestMessageSchema).optional(),
  attachments: z.array(ProjectAttachmentSchema).optional(),
  messageCount: z.number().optional(),
})
export type ProjectRequestItem = z.infer<typeof ProjectRequestItemSchema>

export const ProjectActivityItemSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  projectTitle: z.string(),
  action: z.string(),
  actorEmail: z.string(),
  actorName: z.string().nullable().optional(),
  actorJobTitle: z.string().nullable().optional(),
  actorLabel: z.string().nullable().optional(),
  summary: z.string().optional(),
  createdAt: isoDateTimeString,
})
export type ProjectActivityItem = z.infer<typeof ProjectActivityItemSchema>

export const ClientProjectSummarySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  organizationName: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  status: ClientProjectStatusSchema,
  phase: ClientProjectPhaseSchema,
  createdByEmail: z.string().nullable(),
  approvedAt: isoDateTimeString.nullable(),
  approvedByEmail: z.string().nullable().optional(),
  approvedByName: z.string().nullable().optional(),
  approvedByJobTitle: z.string().nullable().optional(),
  statusLabel: z.string().optional(),
  completedByEmail: z.string().nullable().optional(),
  completedByName: z.string().nullable().optional(),
  completedByJobTitle: z.string().nullable().optional(),
  completedAt: isoDateTimeString.nullable().optional(),
  createdAt: isoDateTimeString,
  updatedAt: isoDateTimeString,
  coverImageUrl: z.string().nullable().optional(),
  openAdminReviewCount: z.number().optional(),
  hasOpenAdminReview: z.boolean().optional(),
  openCancellationCount: z.number().optional(),
  hasOpenCancellation: z.boolean().optional(),
  requests: z.array(ProjectRequestItemSchema).optional(),
  activities: z.array(ProjectActivityItemSchema).optional(),
})
export type ClientProjectSummary = z.infer<typeof ClientProjectSummarySchema>

export const OrganizationBrandAssetSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  uploadedByUserId: z.string(),
  uploadedByEmail: z.string().nullable(),
  uploadedByName: z.string().nullable(),
  createdAt: isoDateTimeString,
})
export type OrganizationBrandAsset = z.infer<typeof OrganizationBrandAssetSchema>

export const PortalUserStatusSchema = z.enum(['ACTIVE', 'INVITED'])
export type PortalUserStatus = z.infer<typeof PortalUserStatusSchema>

export const OrganizationPortalUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  status: PortalUserStatusSchema,
  clientOrgRole: z.string().nullable(),
})
export type OrganizationPortalUser = z.infer<typeof OrganizationPortalUserSchema>

export const OrganizationPortalStatusSchema = z.object({
  hasActiveUsers: z.boolean(),
  hasPortalUsers: z.boolean(),
  needsInvite: z.boolean(),
  activeUserCount: z.number(),
  invitedUsers: z.array(z.object({ id: z.string(), email: z.string() })),
  suggestedContactEmail: z.string().nullable(),
  portalUsers: z.array(OrganizationPortalUserSchema),
})
export type OrganizationPortalStatus = z.infer<typeof OrganizationPortalStatusSchema>

export const CreateProjectForAdminPayloadSchema = z.object({
  title: z.string(),
  description: z.string(),
  recipientUserIds: z.array(z.string()).optional(),
  inviteEmails: z.array(z.string()).optional(),
  contactEmail: z.string().optional(),
})
export type CreateProjectForAdminPayload = z.infer<
  typeof CreateProjectForAdminPayloadSchema
>

export const CreateProjectForAdminResultSchema = z.object({
  project: ClientProjectSummarySchema,
  portalActions: z.object({
    notifiedActiveCount: z.number(),
    inviteRemindersSent: z.number(),
    newInvitesSent: z.number(),
    invitedEmails: z.array(z.string()),
  }),
})
export type CreateProjectForAdminResult = z.infer<
  typeof CreateProjectForAdminResultSchema
>

export const AdminDashboardStatsSchema = z.object({
  activeClients: z.number(),
  activeClientsThisMonth: z.number(),
  openProjects: z.number(),
  projectsAwaitingApproval: z.number(),
  portalInvites: z.number(),
  socialListeningSubscribers: z.number(),
  socialListeningConfigured: z.number(),
})
export type AdminDashboardStats = z.infer<typeof AdminDashboardStatsSchema>

export const AdminRecentActivityItemSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  projectTitle: z.string(),
  organizationId: z.string(),
  organizationName: z.string(),
  action: z.string(),
  summary: z.string().optional(),
  actorEmail: z.string().nullable(),
  actorName: z.string().nullable().optional(),
  actorJobTitle: z.string().nullable().optional(),
  actorLabel: z.string().nullable().optional(),
  createdAt: isoDateTimeString,
  href: z.string(),
})
export type AdminRecentActivityItem = z.infer<typeof AdminRecentActivityItemSchema>

export const AdminRosterItemSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN']),
  status: z.enum(['INVITED', 'ACTIVE', 'SUSPENDED']),
  createdAt: isoDateTimeString,
  updatedAt: isoDateTimeString,
})
export type AdminRosterItem = z.infer<typeof AdminRosterItemSchema>

export const ClientPrimaryContactSchema = z.object({
  id: z.string(),
  email: z.string(),
  status: z.enum(['INVITED', 'ACTIVE', 'SUSPENDED']),
  clientOrgRole: ClientOrgRoleSchema.nullable(),
  canAccessSocialListening: z.boolean(),
})
export type ClientPrimaryContact = z.infer<typeof ClientPrimaryContactSchema>

export const ClientOrganizationRosterItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().nullable(),
  isSocialListeningSubscriber: z.boolean(),
  brand24ProjectId: z.string().nullable(),
  socialListeningLastSnapshotAt: isoDateTimeString.nullable().optional(),
  socialListeningLastSnapshotDate: z.string().nullable().optional(),
  socialListeningLastSnapshotSource: z.string().nullable().optional(),
  createdAt: isoDateTimeString,
  primaryContact: ClientPrimaryContactSchema.nullable(),
})
export type ClientOrganizationRosterItem = z.infer<
  typeof ClientOrganizationRosterItemSchema
>

export const ClientRosterItemSchema = ClientOrganizationRosterItemSchema
export type ClientRosterItem = ClientOrganizationRosterItem

export const InviteClientResultSchema = z.object({
  organization: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    logoUrl: z.string().nullable(),
    isSocialListeningSubscriber: z.boolean(),
    brand24ProjectId: z.string().nullable(),
  }),
  user: ClientPrimaryContactSchema.extend({
    role: z.string(),
    createdAt: isoDateTimeString,
    updatedAt: isoDateTimeString,
  }),
  invitation: z.object({
    provider: z.literal('supabase-auth'),
    status: z.enum(['sent', 'stubbed', 'dev_link']),
    invitationId: z.string(),
    devSignInUrl: z.string().optional(),
  }),
})
export type InviteClientResult = z.infer<typeof InviteClientResultSchema>

export const CollaboratorRosterItemSchema = z.object({
  id: z.string(),
  email: z.string(),
  status: z.enum(['INVITED', 'ACTIVE', 'SUSPENDED']),
  createdAt: isoDateTimeString,
  projects: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      organizationId: z.string(),
      organizationName: z.string(),
    }),
  ),
})
export type CollaboratorRosterItem = z.infer<typeof CollaboratorRosterItemSchema>

export const ProjectCollaboratorRowSchema = z.object({
  id: z.string(),
  userId: z.string(),
  email: z.string(),
  status: z.string(),
  grantedByEmail: z.string(),
  createdAt: isoDateTimeString,
})
export type ProjectCollaboratorRow = z.infer<typeof ProjectCollaboratorRowSchema>

export const ProjectCollaboratorRosterItemSchema = z.object({
  id: z.string(),
  email: z.string(),
  status: z.string(),
  projects: z.array(z.object({ id: z.string() })),
})
export type ProjectCollaboratorRosterItem = z.infer<
  typeof ProjectCollaboratorRosterItemSchema
>

export const AdminProfileSchema = z.object({
  displayName: z.string().nullable(),
  jobTitle: z.string().nullable(),
  jobTitleLabels: z.array(z.string()),
  jobTitleOptionIds: z.array(z.string()),
  avatarUrl: z.string().nullable(),
  email: z.string(),
  profileComplete: z.boolean(),
  updatedAt: isoDateTimeString,
})
export type AdminProfile = z.infer<typeof AdminProfileSchema>

export const ProfileOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
})
export type ProfileOption = z.infer<typeof ProfileOptionSchema>

export const JobTitleOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  sortOrder: z.number(),
  isActive: z.boolean(),
})
export type JobTitleOption = z.infer<typeof JobTitleOptionSchema>

export const TeamMemberSummarySchema = ClientTeamMemberSchema
export type TeamMemberSummary = z.infer<typeof TeamMemberSummarySchema>

export const TeamMemberSchema = ClientTeamMemberSchema
export type TeamMember = ClientTeamMember

export const TeamInviteRequestSummarySchema = TeamInviteRequestSchema
export type TeamInviteRequestSummary = z.infer<typeof TeamInviteRequestSummarySchema>

export const AdminOrgTeamListResponseSchema = z.object({
  ok: z.literal(true),
  members: z.array(TeamMemberSummarySchema),
})
export type AdminOrgTeamListResponse = z.infer<typeof AdminOrgTeamListResponseSchema>

export const AdminTeamInviteRequestsResponseSchema = z.object({
  requests: z.array(TeamInviteRequestSummarySchema),
})
export type AdminTeamInviteRequestsResponse = z.infer<
  typeof AdminTeamInviteRequestsResponseSchema
>

export const InviteRequestSchema = TeamInviteRequestSummarySchema
export type InviteRequest = TeamInviteRequestSummary

export const CollaboratorMeSchema = z.object({
  ok: z.literal(true),
  collaborator: z.object({ id: z.string(), email: z.string() }),
  projects: z.array(
    z.object({ id: z.string(), title: z.string(), organizationName: z.string() }),
  ),
})
export type CollaboratorMe = z.infer<typeof CollaboratorMeSchema>

export const SlAdminStatsSchema = z.object({
  active: z.number(),
  pending: z.number(),
  expiringSoon: z.number(),
  noSetup: z.number(),
})
export type SlAdminStats = z.infer<typeof SlAdminStatsSchema>

export const SlAdminSubscriptionSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  plan: z.string(),
  status: z.string(),
  startedAt: isoDateTimeString.nullable(),
  currentPeriodEnd: isoDateTimeString.nullable(),
  autoRenewEnabled: z.boolean(),
  billingSource: z.string(),
  organization: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    brand24ProjectId: z.string().nullable(),
  }),
})
export type SlAdminSubscription = z.infer<typeof SlAdminSubscriptionSchema>

export const SlPaymentEventSchema = z.object({
  id: z.string(),
  eventType: z.string(),
  amount: z.string(),
  currency: z.string(),
  processedAt: isoDateTimeString,
})
export type SlPaymentEvent = z.infer<typeof SlPaymentEventSchema>

export const SlBillingEmailLogSchema = z.object({
  id: z.string(),
  emailType: z.string(),
  sentAt: isoDateTimeString,
  recipientEmail: z.string(),
})
export type SlBillingEmailLog = z.infer<typeof SlBillingEmailLogSchema>

export const SlListeningSetupSchema = z.object({
  id: z.string(),
  status: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  brand24ProjectId: z.string().nullable(),
  createdBy: z.string(),
  createdAt: isoDateTimeString,
})
export type SlListeningSetup = z.infer<typeof SlListeningSetupSchema>

export const SlSubscriptionDetailSchema = z.object({
  id: z.string(),
  plan: z.string(),
  status: z.string(),
  startedAt: isoDateTimeString.nullable(),
  currentPeriodEnd: isoDateTimeString.nullable(),
  autoRenewEnabled: z.boolean(),
  cancelAtPeriodEnd: z.boolean(),
  billingSource: z.string(),
  paymentMethodLast4: z.string().nullable(),
  paymentMethodBrand: z.string().nullable(),
  paymentEvents: z.array(SlPaymentEventSchema),
  billingEmailLogs: z.array(SlBillingEmailLogSchema),
  organization: z.object({ id: z.string(), name: z.string(), slug: z.string() }),
})
export type SlSubscriptionDetail = z.infer<typeof SlSubscriptionDetailSchema>

export const SlSubscriptionDetailResponseSchema = z.object({
  subscription: SlSubscriptionDetailSchema.nullable(),
  setups: z.array(SlListeningSetupSchema),
})
export type SlSubscriptionDetailResponse = z.infer<
  typeof SlSubscriptionDetailResponseSchema
>

export const SlSubscriptionSummaryResponseSchema = z.object({
  subscription: z
    .object({
      organization: z.object({ id: z.string(), name: z.string(), slug: z.string() }),
    })
    .nullable(),
})
export type SlSubscriptionSummaryResponse = z.infer<
  typeof SlSubscriptionSummaryResponseSchema
>

export const ClientRosterOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
})
export type ClientRosterOption = z.infer<typeof ClientRosterOptionSchema>

export const ClientRowSchema = z.object({
  id: z.string(),
  name: z.string(),
})
export type ClientRow = z.infer<typeof ClientRowSchema>

export {
  ClientFilesLibrarySchema,
  ClientProjectPhaseSchema,
  ClientProjectStatusSchema,
  ProjectAttachmentSchema,
  ProjectAttachmentWithUsageSchema,
  ProjectAttachmentWithReactionsSchema,
  FileReactionsResponseSchema,
  ProjectFileReactionKindSchema,
  ProjectFileReactionTagSchema,
  ProjectFilesGroupSchema,
  ProjectRequestStatusSchema,
  TopPicksResponseSchema,
} from './shared/projects'

export type {
  ClientFilesLibrary,
  ClientProjectPhase,
  ClientProjectStatus,
  ProjectAttachment,
  ProjectAttachmentWithUsage,
  ProjectAttachmentWithReactions,
  FileReactionsResponse,
  ProjectFileReactionKind,
  ProjectFileReactionTag,
  ProjectFilesGroup,
  ProjectRequestStatus,
  TopPicksResponse,
} from './shared/projects'

export const AdminAuthMeResponseSchema = z.object({
  ok: z.literal(true),
  mode: z.enum(['user', 'api_key']),
  admin: z
    .object({
      id: z.string(),
      email: z.string(),
      status: z.string(),
      role: z.string(),
      profile: AdminProfileSchema.nullable(),
    })
    .optional(),
})
export type AdminAuthMeResponse = z.infer<typeof AdminAuthMeResponseSchema>

export const SignedUploadResponseSchema = z.object({
  storagePath: z.string(),
  signedUrl: z.string(),
  token: z.string(),
  expiresIn: z.number(),
})
export type SignedUploadResponse = z.infer<typeof SignedUploadResponseSchema>

export const AttachmentDownloadResponseSchema = z.object({
  download: z.object({
    signedUrl: z.string(),
  }),
})
export type AttachmentDownloadResponse = z.infer<typeof AttachmentDownloadResponseSchema>

export {
  OrgInboxAuthorRoleSchema,
  OrgInboxConversationListResponseSchema,
  OrgInboxConversationSchema,
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
  OrgInboxMessage,
  OrgInboxMessageListResponse,
  OrgInboxRealtimeAuthResponse,
  OrgInboxSendMessageResponse,
  OrgInboxUnreadCountResponse,
  OrgInboxVisibility,
} from './shared/org-inbox'
