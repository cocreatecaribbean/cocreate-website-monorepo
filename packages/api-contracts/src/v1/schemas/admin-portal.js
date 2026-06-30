"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectRequestStatusSchema = exports.ProjectFilesGroupSchema = exports.ProjectAttachmentWithUsageSchema = exports.ProjectAttachmentSchema = exports.ClientProjectStatusSchema = exports.ClientProjectPhaseSchema = exports.ClientFilesLibrarySchema = exports.ClientRowSchema = exports.ClientRosterOptionSchema = exports.SlSubscriptionSummaryResponseSchema = exports.SlSubscriptionDetailResponseSchema = exports.SlSubscriptionDetailSchema = exports.SlListeningSetupSchema = exports.SlBillingEmailLogSchema = exports.SlPaymentEventSchema = exports.SlAdminSubscriptionSchema = exports.SlAdminStatsSchema = exports.CollaboratorMeSchema = exports.InviteRequestSchema = exports.TeamInviteRequestSummarySchema = exports.TeamMemberSchema = exports.TeamMemberSummarySchema = exports.JobTitleOptionSchema = exports.ProfileOptionSchema = exports.AdminProfileSchema = exports.ProjectCollaboratorRosterItemSchema = exports.ProjectCollaboratorRowSchema = exports.CollaboratorRosterItemSchema = exports.InviteClientResultSchema = exports.ClientRosterItemSchema = exports.ClientOrganizationRosterItemSchema = exports.ClientPrimaryContactSchema = exports.AdminRosterItemSchema = exports.AdminRecentActivityItemSchema = exports.AdminDashboardStatsSchema = exports.CreateProjectForAdminResultSchema = exports.CreateProjectForAdminPayloadSchema = exports.OrganizationPortalStatusSchema = exports.OrganizationPortalUserSchema = exports.PortalUserStatusSchema = exports.OrganizationBrandAssetSchema = exports.ClientProjectSummarySchema = exports.ProjectActivityItemSchema = exports.ProjectRequestItemSchema = exports.FilesQuerySchema = exports.ProjectRequestMessageSchema = exports.ProjectRequestTypeSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("../../zod/common");
const enums_1 = require("../../zod/enums");
const projects_1 = require("./shared/projects");
exports.ProjectRequestTypeSchema = zod_1.z.enum([
    'ONBOARDING',
    'PROGRESS',
    'CANCELLATION',
    'INTERNAL',
]);
exports.ProjectRequestMessageSchema = projects_1.ProjectRequestMessageBaseSchema.extend({
    authorRole: zod_1.z.enum(['ADMIN', 'CLIENT', 'COLLABORATOR']),
});
exports.FilesQuerySchema = projects_1.FilesQueryBaseSchema.extend({
    visibility: zod_1.z.enum(['CLIENT', 'INTERNAL']).optional(),
});
exports.ProjectRequestItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    projectId: zod_1.z.string(),
    projectTitle: zod_1.z.string().nullable(),
    organizationId: zod_1.z.string().nullable(),
    organizationName: zod_1.z.string().nullable(),
    type: exports.ProjectRequestTypeSchema,
    status: projects_1.ProjectRequestStatusSchema,
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    targetPhase: projects_1.ClientProjectPhaseSchema.nullable(),
    cancellationOutcome: zod_1.z.string().nullable().optional(),
    cancellationFeeAmount: zod_1.z.number().nullable().optional(),
    cancellationFeeNotes: zod_1.z.string().nullable().optional(),
    createdByEmail: zod_1.z.string().nullable(),
    createdAt: common_1.isoDateTimeString,
    messages: zod_1.z.array(exports.ProjectRequestMessageSchema).optional(),
    attachments: zod_1.z.array(projects_1.ProjectAttachmentSchema).optional(),
    messageCount: zod_1.z.number().optional(),
});
exports.ProjectActivityItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    projectId: zod_1.z.string(),
    projectTitle: zod_1.z.string(),
    action: zod_1.z.string(),
    actorEmail: zod_1.z.string(),
    actorName: zod_1.z.string().nullable().optional(),
    actorJobTitle: zod_1.z.string().nullable().optional(),
    actorLabel: zod_1.z.string().nullable().optional(),
    summary: zod_1.z.string().optional(),
    createdAt: common_1.isoDateTimeString,
});
exports.ClientProjectSummarySchema = zod_1.z.object({
    id: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    organizationName: zod_1.z.string().nullable(),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    status: projects_1.ClientProjectStatusSchema,
    phase: projects_1.ClientProjectPhaseSchema,
    createdByEmail: zod_1.z.string().nullable(),
    approvedAt: common_1.isoDateTimeString.nullable(),
    approvedByEmail: zod_1.z.string().nullable().optional(),
    approvedByName: zod_1.z.string().nullable().optional(),
    approvedByJobTitle: zod_1.z.string().nullable().optional(),
    statusLabel: zod_1.z.string().optional(),
    completedByEmail: zod_1.z.string().nullable().optional(),
    completedByName: zod_1.z.string().nullable().optional(),
    completedByJobTitle: zod_1.z.string().nullable().optional(),
    completedAt: common_1.isoDateTimeString.nullable().optional(),
    createdAt: common_1.isoDateTimeString,
    updatedAt: common_1.isoDateTimeString,
    coverImageUrl: zod_1.z.string().nullable().optional(),
    pendingCheckpointCount: zod_1.z.number().optional(),
    hasPendingCheckpoint: zod_1.z.boolean().optional(),
    openAdminReviewCount: zod_1.z.number().optional(),
    hasOpenAdminReview: zod_1.z.boolean().optional(),
    openCancellationCount: zod_1.z.number().optional(),
    hasOpenCancellation: zod_1.z.boolean().optional(),
    requests: zod_1.z.array(exports.ProjectRequestItemSchema).optional(),
    activities: zod_1.z.array(exports.ProjectActivityItemSchema).optional(),
});
exports.OrganizationBrandAssetSchema = zod_1.z.object({
    id: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    fileName: zod_1.z.string(),
    mimeType: zod_1.z.string(),
    sizeBytes: zod_1.z.number(),
    uploadedByUserId: zod_1.z.string(),
    uploadedByEmail: zod_1.z.string().nullable(),
    uploadedByName: zod_1.z.string().nullable(),
    createdAt: common_1.isoDateTimeString,
});
exports.PortalUserStatusSchema = zod_1.z.enum(['ACTIVE', 'INVITED']);
exports.OrganizationPortalUserSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string(),
    status: exports.PortalUserStatusSchema,
    clientOrgRole: zod_1.z.string().nullable(),
});
exports.OrganizationPortalStatusSchema = zod_1.z.object({
    hasActiveUsers: zod_1.z.boolean(),
    hasPortalUsers: zod_1.z.boolean(),
    needsInvite: zod_1.z.boolean(),
    activeUserCount: zod_1.z.number(),
    invitedUsers: zod_1.z.array(zod_1.z.object({ id: zod_1.z.string(), email: zod_1.z.string() })),
    suggestedContactEmail: zod_1.z.string().nullable(),
    portalUsers: zod_1.z.array(exports.OrganizationPortalUserSchema),
});
exports.CreateProjectForAdminPayloadSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    recipientUserIds: zod_1.z.array(zod_1.z.string()).optional(),
    inviteEmails: zod_1.z.array(zod_1.z.string()).optional(),
    contactEmail: zod_1.z.string().optional(),
});
exports.CreateProjectForAdminResultSchema = zod_1.z.object({
    project: exports.ClientProjectSummarySchema,
    portalActions: zod_1.z.object({
        notifiedActiveCount: zod_1.z.number(),
        inviteRemindersSent: zod_1.z.number(),
        newInvitesSent: zod_1.z.number(),
        invitedEmails: zod_1.z.array(zod_1.z.string()),
    }),
});
exports.AdminDashboardStatsSchema = zod_1.z.object({
    activeClients: zod_1.z.number(),
    activeClientsThisMonth: zod_1.z.number(),
    openProjects: zod_1.z.number(),
    projectsAwaitingApproval: zod_1.z.number(),
    portalInvites: zod_1.z.number(),
    socialListeningSubscribers: zod_1.z.number(),
    socialListeningConfigured: zod_1.z.number(),
});
exports.AdminRecentActivityItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    projectId: zod_1.z.string(),
    projectTitle: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    organizationName: zod_1.z.string(),
    action: zod_1.z.string(),
    summary: zod_1.z.string().optional(),
    actorEmail: zod_1.z.string().nullable(),
    actorName: zod_1.z.string().nullable().optional(),
    actorJobTitle: zod_1.z.string().nullable().optional(),
    actorLabel: zod_1.z.string().nullable().optional(),
    createdAt: common_1.isoDateTimeString,
    href: zod_1.z.string(),
});
exports.AdminRosterItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string(),
    role: zod_1.z.enum(['SUPER_ADMIN', 'ADMIN']),
    status: zod_1.z.enum(['INVITED', 'ACTIVE', 'SUSPENDED']),
    createdAt: common_1.isoDateTimeString,
    updatedAt: common_1.isoDateTimeString,
});
exports.ClientPrimaryContactSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string(),
    status: zod_1.z.enum(['INVITED', 'ACTIVE', 'SUSPENDED']),
    clientOrgRole: enums_1.ClientOrgRoleSchema.nullable(),
    canAccessSocialListening: zod_1.z.boolean(),
});
exports.ClientOrganizationRosterItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    slug: zod_1.z.string(),
    logoUrl: zod_1.z.string().nullable(),
    isSocialListeningSubscriber: zod_1.z.boolean(),
    brand24ProjectId: zod_1.z.string().nullable(),
    createdAt: common_1.isoDateTimeString,
    primaryContact: exports.ClientPrimaryContactSchema.nullable(),
});
exports.ClientRosterItemSchema = exports.ClientOrganizationRosterItemSchema;
exports.InviteClientResultSchema = zod_1.z.object({
    organization: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        slug: zod_1.z.string(),
        logoUrl: zod_1.z.string().nullable(),
        isSocialListeningSubscriber: zod_1.z.boolean(),
        brand24ProjectId: zod_1.z.string().nullable(),
    }),
    user: exports.ClientPrimaryContactSchema.extend({
        role: zod_1.z.string(),
        createdAt: common_1.isoDateTimeString,
        updatedAt: common_1.isoDateTimeString,
    }),
    invitation: zod_1.z.object({
        provider: zod_1.z.literal('supabase-auth'),
        status: zod_1.z.enum(['sent', 'stubbed', 'dev_link']),
        invitationId: zod_1.z.string(),
        devSignInUrl: zod_1.z.string().optional(),
    }),
});
exports.CollaboratorRosterItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string(),
    status: zod_1.z.enum(['INVITED', 'ACTIVE', 'SUSPENDED']),
    createdAt: common_1.isoDateTimeString,
    projects: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        title: zod_1.z.string(),
        organizationId: zod_1.z.string(),
        organizationName: zod_1.z.string(),
    })),
});
exports.ProjectCollaboratorRowSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    email: zod_1.z.string(),
    status: zod_1.z.string(),
    grantedByEmail: zod_1.z.string(),
    createdAt: common_1.isoDateTimeString,
});
exports.ProjectCollaboratorRosterItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string(),
    status: zod_1.z.string(),
    projects: zod_1.z.array(zod_1.z.object({ id: zod_1.z.string() })),
});
exports.AdminProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().nullable(),
    jobTitle: zod_1.z.string().nullable(),
    jobTitleLabels: zod_1.z.array(zod_1.z.string()),
    jobTitleOptionIds: zod_1.z.array(zod_1.z.string()),
    avatarUrl: zod_1.z.string().nullable(),
    email: zod_1.z.string(),
    profileComplete: zod_1.z.boolean(),
    updatedAt: common_1.isoDateTimeString,
});
exports.ProfileOptionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    label: zod_1.z.string(),
});
exports.JobTitleOptionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    label: zod_1.z.string(),
    sortOrder: zod_1.z.number(),
    isActive: zod_1.z.boolean(),
});
exports.TeamMemberSummarySchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string(),
    status: zod_1.z.string(),
    clientOrgRole: enums_1.ClientOrgRoleSchema.nullable(),
    canAccessSocialListening: zod_1.z.boolean(),
});
exports.TeamMemberSchema = exports.TeamMemberSummarySchema;
exports.TeamInviteRequestSummarySchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string(),
    requestedClientOrgRole: enums_1.ClientOrgRoleSchema,
    status: zod_1.z.string(),
    requestedByEmail: zod_1.z.string(),
    createdAt: common_1.isoDateTimeString,
});
exports.InviteRequestSchema = exports.TeamInviteRequestSummarySchema;
exports.CollaboratorMeSchema = zod_1.z.object({
    ok: zod_1.z.literal(true),
    collaborator: zod_1.z.object({ id: zod_1.z.string(), email: zod_1.z.string() }),
    projects: zod_1.z.array(zod_1.z.object({ id: zod_1.z.string(), title: zod_1.z.string(), organizationName: zod_1.z.string() })),
});
exports.SlAdminStatsSchema = zod_1.z.object({
    active: zod_1.z.number(),
    pending: zod_1.z.number(),
    expiringSoon: zod_1.z.number(),
    noSetup: zod_1.z.number(),
});
exports.SlAdminSubscriptionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    plan: zod_1.z.string(),
    status: zod_1.z.string(),
    startedAt: common_1.isoDateTimeString.nullable(),
    currentPeriodEnd: common_1.isoDateTimeString.nullable(),
    autoRenewEnabled: zod_1.z.boolean(),
    billingSource: zod_1.z.string(),
    organization: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        slug: zod_1.z.string(),
        brand24ProjectId: zod_1.z.string().nullable(),
    }),
});
exports.SlPaymentEventSchema = zod_1.z.object({
    id: zod_1.z.string(),
    eventType: zod_1.z.string(),
    amount: zod_1.z.string(),
    currency: zod_1.z.string(),
    processedAt: common_1.isoDateTimeString,
});
exports.SlBillingEmailLogSchema = zod_1.z.object({
    id: zod_1.z.string(),
    emailType: zod_1.z.string(),
    sentAt: common_1.isoDateTimeString,
    recipientEmail: zod_1.z.string(),
});
exports.SlListeningSetupSchema = zod_1.z.object({
    id: zod_1.z.string(),
    status: zod_1.z.string(),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string(),
    brand24ProjectId: zod_1.z.string().nullable(),
    createdBy: zod_1.z.string(),
    createdAt: common_1.isoDateTimeString,
});
exports.SlSubscriptionDetailSchema = zod_1.z.object({
    id: zod_1.z.string(),
    plan: zod_1.z.string(),
    status: zod_1.z.string(),
    startedAt: common_1.isoDateTimeString.nullable(),
    currentPeriodEnd: common_1.isoDateTimeString.nullable(),
    autoRenewEnabled: zod_1.z.boolean(),
    cancelAtPeriodEnd: zod_1.z.boolean(),
    billingSource: zod_1.z.string(),
    paymentMethodLast4: zod_1.z.string().nullable(),
    paymentMethodBrand: zod_1.z.string().nullable(),
    paymentEvents: zod_1.z.array(exports.SlPaymentEventSchema),
    billingEmailLogs: zod_1.z.array(exports.SlBillingEmailLogSchema),
    organization: zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string(), slug: zod_1.z.string() }),
});
exports.SlSubscriptionDetailResponseSchema = zod_1.z.object({
    subscription: exports.SlSubscriptionDetailSchema.nullable(),
    setups: zod_1.z.array(exports.SlListeningSetupSchema),
});
exports.SlSubscriptionSummaryResponseSchema = zod_1.z.object({
    subscription: zod_1.z
        .object({
        organization: zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string(), slug: zod_1.z.string() }),
    })
        .nullable(),
});
exports.ClientRosterOptionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    slug: zod_1.z.string(),
});
exports.ClientRowSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
});
var projects_2 = require("./shared/projects");
Object.defineProperty(exports, "ClientFilesLibrarySchema", { enumerable: true, get: function () { return projects_2.ClientFilesLibrarySchema; } });
Object.defineProperty(exports, "ClientProjectPhaseSchema", { enumerable: true, get: function () { return projects_2.ClientProjectPhaseSchema; } });
Object.defineProperty(exports, "ClientProjectStatusSchema", { enumerable: true, get: function () { return projects_2.ClientProjectStatusSchema; } });
Object.defineProperty(exports, "ProjectAttachmentSchema", { enumerable: true, get: function () { return projects_2.ProjectAttachmentSchema; } });
Object.defineProperty(exports, "ProjectAttachmentWithUsageSchema", { enumerable: true, get: function () { return projects_2.ProjectAttachmentWithUsageSchema; } });
Object.defineProperty(exports, "ProjectFilesGroupSchema", { enumerable: true, get: function () { return projects_2.ProjectFilesGroupSchema; } });
Object.defineProperty(exports, "ProjectRequestStatusSchema", { enumerable: true, get: function () { return projects_2.ProjectRequestStatusSchema; } });
//# sourceMappingURL=admin-portal.js.map