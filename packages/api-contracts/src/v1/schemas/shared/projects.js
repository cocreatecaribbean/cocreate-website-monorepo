"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesQueryBaseSchema = exports.ClientFilesLibrarySchema = exports.ProjectFilesGroupSchema = exports.ProjectAttachmentWithUsageSchema = exports.ProjectActivitySchema = exports.ProjectRequestMessageBaseSchema = exports.ProjectAttachmentSchema = exports.ProjectRequestStatusSchema = exports.ClientProjectPhaseSchema = exports.ClientProjectStatusSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("../../../zod/common");
exports.ClientProjectStatusSchema = zod_1.z.enum([
    'SUBMITTED',
    'ACTIVE',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED',
]);
exports.ClientProjectPhaseSchema = zod_1.z.enum([
    'DISCOVERY',
    'IN_PROGRESS',
    'CLIENT_REVIEW',
    'READY_FOR_DELIVERY',
    'DELIVERED',
]);
exports.ProjectRequestStatusSchema = zod_1.z.enum([
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'REJECTED',
    'CANCELLED',
]);
exports.ProjectAttachmentSchema = zod_1.z.object({
    id: zod_1.z.string(),
    projectId: zod_1.z.string(),
    requestId: zod_1.z.string().nullable(),
    fileName: zod_1.z.string(),
    mimeType: zod_1.z.string(),
    sizeBytes: zod_1.z.number(),
    createdAt: common_1.isoDateTimeString,
});
exports.ProjectRequestMessageBaseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    requestId: zod_1.z.string(),
    authorUserId: zod_1.z.string(),
    authorEmail: zod_1.z.string().nullable(),
    authorDisplayName: zod_1.z.string().nullable().optional(),
    authorJobTitle: zod_1.z.string().nullable().optional(),
    body: zod_1.z.string(),
    messageKind: zod_1.z.enum(['CHAT', 'CHECKPOINT']).optional(),
    checkpointTargetPhase: exports.ClientProjectPhaseSchema.nullable().optional(),
    requiresClientApproval: zod_1.z.boolean().optional(),
    clientApprovedAt: common_1.isoDateTimeString.nullable().optional(),
    supersededAt: common_1.isoDateTimeString.nullable().optional(),
    isPendingApproval: zod_1.z.boolean().optional(),
    createdAt: common_1.isoDateTimeString,
    attachmentIds: zod_1.z.array(zod_1.z.string()).optional(),
    attachments: zod_1.z.array(exports.ProjectAttachmentSchema).optional(),
});
exports.ProjectActivitySchema = zod_1.z.object({
    id: zod_1.z.string(),
    action: zod_1.z.string(),
    actorEmail: zod_1.z.string().nullable(),
    actorName: zod_1.z.string().nullable(),
    actorJobTitle: zod_1.z.string().nullable().optional(),
    actorLabel: zod_1.z.string().nullable().optional(),
    summary: zod_1.z.string(),
    createdAt: common_1.isoDateTimeString,
});
exports.ProjectAttachmentWithUsageSchema = exports.ProjectAttachmentSchema.extend({
    usedInThreads: zod_1.z.boolean(),
    messageRefsCount: zod_1.z.number(),
    lastUsedAt: common_1.isoDateTimeString.nullable(),
});
exports.ProjectFilesGroupSchema = zod_1.z.object({
    projectId: zod_1.z.string(),
    projectTitle: zod_1.z.string(),
    libraryUploads: zod_1.z.array(exports.ProjectAttachmentWithUsageSchema),
    usedInThreads: zod_1.z.array(exports.ProjectAttachmentWithUsageSchema),
});
exports.ClientFilesLibrarySchema = zod_1.z.object({
    projects: zod_1.z.array(exports.ProjectFilesGroupSchema),
    files: zod_1.z
        .array(exports.ProjectAttachmentWithUsageSchema.extend({ projectTitle: zod_1.z.string() }))
        .optional(),
    nextCursor: zod_1.z.string().nullable().optional(),
});
exports.FilesQueryBaseSchema = zod_1.z.object({
    projectId: zod_1.z.string().optional(),
    q: zod_1.z.string().optional(),
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().optional(),
});
//# sourceMappingURL=projects.js.map