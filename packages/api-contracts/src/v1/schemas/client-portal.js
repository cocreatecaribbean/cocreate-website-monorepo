"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectRequestStatusSchema = exports.ProjectFilesGroupSchema = exports.ProjectAttachmentWithUsageSchema = exports.ProjectAttachmentSchema = exports.ProjectActivitySchema = exports.ClientProjectStatusSchema = exports.ClientProjectPhaseSchema = exports.ClientFilesLibrarySchema = exports.PortalNotificationItemSchema = exports.ClientDashboardStatsSchema = exports.ClientProjectDetailSchema = exports.ClientApprovalRecordItemSchema = exports.ProjectRequestItemSchema = exports.ClientProjectSummarySchema = exports.FilesQuerySchema = exports.ProjectRequestMessageSchema = exports.ProjectRequestTypeSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("../../zod/common");
const projects_1 = require("./shared/projects");
exports.ProjectRequestTypeSchema = zod_1.z.enum([
    'ONBOARDING',
    'PROGRESS',
    'CANCELLATION',
]);
exports.ProjectRequestMessageSchema = projects_1.ProjectRequestMessageBaseSchema.extend({
    authorRole: zod_1.z.enum(['ADMIN', 'CLIENT']),
});
exports.FilesQuerySchema = projects_1.FilesQueryBaseSchema;
exports.ClientProjectSummarySchema = zod_1.z.object({
    id: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    status: projects_1.ClientProjectStatusSchema,
    statusLabel: zod_1.z.string().optional(),
    phase: projects_1.ClientProjectPhaseSchema,
    approvedByEmail: zod_1.z.string().nullable().optional(),
    approvedByName: zod_1.z.string().nullable().optional(),
    approvedByJobTitle: zod_1.z.string().nullable().optional(),
    approvedAt: common_1.isoDateTimeString.nullable().optional(),
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
    activities: zod_1.z.array(projects_1.ProjectActivitySchema).optional(),
});
exports.ProjectRequestItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    projectId: zod_1.z.string(),
    projectTitle: zod_1.z.string().nullable().optional(),
    type: exports.ProjectRequestTypeSchema,
    status: projects_1.ProjectRequestStatusSchema,
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    targetPhase: projects_1.ClientProjectPhaseSchema.nullable(),
    cancellationOutcome: zod_1.z.string().nullable().optional(),
    cancellationFeeAmount: zod_1.z.number().nullable().optional(),
    cancellationFeeNotes: zod_1.z.string().nullable().optional(),
    createdAt: common_1.isoDateTimeString,
    messages: zod_1.z.array(exports.ProjectRequestMessageSchema).optional(),
    attachments: zod_1.z.array(projects_1.ProjectAttachmentSchema).optional(),
    messageCount: zod_1.z.number().optional(),
});
exports.ClientApprovalRecordItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    projectId: zod_1.z.string(),
    projectTitle: zod_1.z.string().optional(),
    requestId: zod_1.z.string(),
    messageId: zod_1.z.string(),
    title: zod_1.z.string(),
    summary: zod_1.z.string().nullable(),
    targetPhase: projects_1.ClientProjectPhaseSchema.nullable(),
    approvedAt: common_1.isoDateTimeString,
});
exports.ClientProjectDetailSchema = exports.ClientProjectSummarySchema.extend({
    requests: zod_1.z.array(exports.ProjectRequestItemSchema).optional(),
    attachments: zod_1.z.array(projects_1.ProjectAttachmentSchema).optional(),
    activities: zod_1.z.array(projects_1.ProjectActivitySchema).optional(),
});
exports.ClientDashboardStatsSchema = zod_1.z.object({
    activeProjects: zod_1.z.number(),
    activeProjectsAwaitingReview: zod_1.z.number(),
    pendingApprovals: zod_1.z.number(),
    sharedFiles: zod_1.z.number(),
    lastSharedFileAt: common_1.isoDateTimeString.nullable(),
});
exports.PortalNotificationItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.string(),
    title: zod_1.z.string(),
    body: zod_1.z.string(),
    href: zod_1.z.string().nullable(),
    readAt: common_1.isoDateTimeString.nullable(),
    projectId: zod_1.z.string().nullable(),
    requestId: zod_1.z.string().nullable(),
    createdAt: common_1.isoDateTimeString,
});
var projects_2 = require("./shared/projects");
Object.defineProperty(exports, "ClientFilesLibrarySchema", { enumerable: true, get: function () { return projects_2.ClientFilesLibrarySchema; } });
Object.defineProperty(exports, "ClientProjectPhaseSchema", { enumerable: true, get: function () { return projects_2.ClientProjectPhaseSchema; } });
Object.defineProperty(exports, "ClientProjectStatusSchema", { enumerable: true, get: function () { return projects_2.ClientProjectStatusSchema; } });
Object.defineProperty(exports, "ProjectActivitySchema", { enumerable: true, get: function () { return projects_2.ProjectActivitySchema; } });
Object.defineProperty(exports, "ProjectAttachmentSchema", { enumerable: true, get: function () { return projects_2.ProjectAttachmentSchema; } });
Object.defineProperty(exports, "ProjectAttachmentWithUsageSchema", { enumerable: true, get: function () { return projects_2.ProjectAttachmentWithUsageSchema; } });
Object.defineProperty(exports, "ProjectFilesGroupSchema", { enumerable: true, get: function () { return projects_2.ProjectFilesGroupSchema; } });
Object.defineProperty(exports, "ProjectRequestStatusSchema", { enumerable: true, get: function () { return projects_2.ProjectRequestStatusSchema; } });
//# sourceMappingURL=client-portal.js.map