"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkInboxReadSchema = exports.MarkAttentionReadSchema = exports.CreateProjectForAdminSchema = exports.CreateAgencyCollaboratorSchema = exports.InviteAgencyCollaboratorSchema = exports.AddProjectMemberSchema = exports.UpdateTeamMemberSchema = exports.RejectTeamInviteSchema = exports.RequestTeamInviteSchema = exports.InviteTeamMemberSchema = exports.RegisterBrandAssetSchema = exports.RegisterCoverSchema = exports.RegisterAttachmentSchema = exports.CreateCheckpointSchema = exports.StagedCheckpointAttachmentSchema = exports.UploadUrlSchema = exports.ResolveCancellationSchema = exports.UpdateRequestSchema = exports.CreateRequestMessageSchema = exports.CreatePhaseApprovalSchema = exports.CreateCancellationRequestSchema = exports.CreateReviewRequestSchema = exports.CreateChangeRequestSchema = exports.UpdateProjectSchema = exports.CreateProjectSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("../../zod/common");
const enums_1 = require("../../zod/enums");
const projects_1 = require("../schemas/shared/projects");
exports.CreateProjectSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).max(200),
    description: zod_1.z.string().min(1).max(10000),
});
exports.UpdateProjectSchema = zod_1.z.object({
    status: projects_1.ClientProjectStatusSchema.optional(),
    phase: projects_1.ClientProjectPhaseSchema.optional(),
});
exports.CreateChangeRequestSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).max(200),
    description: zod_1.z.string().min(1).max(10000),
});
exports.CreateReviewRequestSchema = exports.CreateChangeRequestSchema;
exports.CreateCancellationRequestSchema = zod_1.z.object({
    reason: zod_1.z.string().max(8000).optional(),
});
exports.CreatePhaseApprovalSchema = zod_1.z.object({
    targetPhase: projects_1.ClientProjectPhaseSchema,
    description: zod_1.z.string().min(1).max(10000).optional(),
});
exports.CreateRequestMessageSchema = zod_1.z.object({
    body: zod_1.z.string().min(1).max(10000),
    attachmentIds: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.UpdateRequestSchema = zod_1.z.object({
    status: enums_1.ProjectRequestStatusSchema,
});
exports.ResolveCancellationSchema = zod_1.z.object({
    outcome: enums_1.CancellationOutcomeSchema,
    feeAmount: zod_1.z.number().min(0).optional(),
    feeNotes: zod_1.z.string().max(4000).optional(),
    message: zod_1.z.string().max(8000).optional(),
});
exports.UploadUrlSchema = zod_1.z.object({
    fileName: zod_1.z.string().min(1).max(255),
    mimeType: zod_1.z.string().min(1).max(127),
    sizeBytes: zod_1.z.number().int().min(1).max(104857600),
});
exports.StagedCheckpointAttachmentSchema = exports.UploadUrlSchema.extend({
    storagePath: zod_1.z.string().min(1).max(512),
});
exports.CreateCheckpointSchema = zod_1.z.object({
    title: zod_1.z.string().max(200),
    body: zod_1.z.string().max(8000),
    reviewUrl: zod_1.z.string().url().max(2048).optional(),
    targetPhase: projects_1.ClientProjectPhaseSchema.optional(),
    attachments: zod_1.z.array(exports.StagedCheckpointAttachmentSchema).optional(),
});
exports.RegisterAttachmentSchema = exports.UploadUrlSchema.extend({
    storagePath: zod_1.z.string().min(1).max(512),
    requestId: zod_1.z.string().optional(),
    visibility: enums_1.ProjectAttachmentVisibilitySchema.optional(),
});
exports.RegisterCoverSchema = zod_1.z.object({
    storagePath: zod_1.z.string().max(500),
});
exports.RegisterBrandAssetSchema = exports.UploadUrlSchema.extend({
    storagePath: zod_1.z.string().min(1).max(512),
});
exports.InviteTeamMemberSchema = zod_1.z.object({
    email: common_1.emailString,
    clientOrgRole: enums_1.ClientOrgRoleSchema,
    canAccessSocialListening: zod_1.z.boolean().optional(),
});
exports.RequestTeamInviteSchema = zod_1.z.object({
    email: common_1.emailString,
    clientOrgRole: enums_1.ClientOrgRoleSchema,
});
exports.RejectTeamInviteSchema = zod_1.z.object({
    rejectionReason: zod_1.z.string().max(500).optional(),
});
exports.UpdateTeamMemberSchema = zod_1.z.object({
    clientOrgRole: enums_1.ClientOrgRoleSchema.optional(),
    canAccessSocialListening: zod_1.z.boolean().optional(),
});
exports.AddProjectMemberSchema = zod_1.z.object({
    email: common_1.emailString,
    access: enums_1.ClientProjectAccessLevelSchema,
});
exports.InviteAgencyCollaboratorSchema = zod_1.z.object({
    email: zod_1.z.string().email().max(320).optional(),
    userId: zod_1.z.string().optional(),
});
exports.CreateAgencyCollaboratorSchema = zod_1.z.object({
    email: zod_1.z.string().email().max(320),
    projectIds: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.CreateProjectForAdminSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).max(200),
    description: zod_1.z.string().min(1).max(10000),
    recipientUserIds: zod_1.z.array(common_1.uuidString).optional(),
    inviteEmails: zod_1.z.array(zod_1.z.string().email().max(320)).optional(),
    contactEmail: zod_1.z.string().email().max(320).optional(),
});
exports.MarkAttentionReadSchema = zod_1.z.object({
    requestId: zod_1.z.string().optional(),
    projectId: zod_1.z.string().optional(),
});
exports.MarkInboxReadSchema = zod_1.z.object({
    requestId: zod_1.z.string().optional(),
});
//# sourceMappingURL=projects.js.map