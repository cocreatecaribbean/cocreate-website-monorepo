import { z } from 'zod';
export declare const ProjectRequestTypeSchema: z.ZodEnum<{
    PROGRESS: "PROGRESS";
    ONBOARDING: "ONBOARDING";
    CANCELLATION: "CANCELLATION";
}>;
export type ProjectRequestType = z.infer<typeof ProjectRequestTypeSchema>;
export declare const ProjectRequestMessageSchema: z.ZodObject<{
    id: z.ZodString;
    requestId: z.ZodString;
    authorUserId: z.ZodString;
    authorEmail: z.ZodNullable<z.ZodString>;
    authorDisplayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    authorJobTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    body: z.ZodString;
    messageKind: z.ZodOptional<z.ZodEnum<{
        CHAT: "CHAT";
        CHECKPOINT: "CHECKPOINT";
    }>>;
    checkpointTargetPhase: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        IN_PROGRESS: "IN_PROGRESS";
        DISCOVERY: "DISCOVERY";
        CLIENT_REVIEW: "CLIENT_REVIEW";
        READY_FOR_DELIVERY: "READY_FOR_DELIVERY";
        DELIVERED: "DELIVERED";
    }>>>;
    requiresClientApproval: z.ZodOptional<z.ZodBoolean>;
    clientApprovedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    supersededAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPendingApproval: z.ZodOptional<z.ZodBoolean>;
    createdAt: z.ZodString;
    attachmentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        projectId: z.ZodString;
        requestId: z.ZodNullable<z.ZodString>;
        fileName: z.ZodString;
        mimeType: z.ZodString;
        sizeBytes: z.ZodNumber;
        createdAt: z.ZodString;
    }, z.core.$strip>>>;
    authorRole: z.ZodEnum<{
        ADMIN: "ADMIN";
        CLIENT: "CLIENT";
    }>;
}, z.core.$strip>;
export type ProjectRequestMessage = z.infer<typeof ProjectRequestMessageSchema>;
export declare const FilesQuerySchema: z.ZodObject<{
    projectId: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type FilesQuery = z.infer<typeof FilesQuerySchema>;
export declare const ClientProjectSummarySchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    status: z.ZodEnum<{
        ACTIVE: "ACTIVE";
        CANCELLED: "CANCELLED";
        SUBMITTED: "SUBMITTED";
        ON_HOLD: "ON_HOLD";
        COMPLETED: "COMPLETED";
    }>;
    statusLabel: z.ZodOptional<z.ZodString>;
    phase: z.ZodEnum<{
        IN_PROGRESS: "IN_PROGRESS";
        DISCOVERY: "DISCOVERY";
        CLIENT_REVIEW: "CLIENT_REVIEW";
        READY_FOR_DELIVERY: "READY_FOR_DELIVERY";
        DELIVERED: "DELIVERED";
    }>;
    approvedByEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    approvedByName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    approvedByJobTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    approvedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    completedByEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    completedByName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    completedByJobTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    completedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    coverImageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    pendingCheckpointCount: z.ZodOptional<z.ZodNumber>;
    hasPendingCheckpoint: z.ZodOptional<z.ZodBoolean>;
    openAdminReviewCount: z.ZodOptional<z.ZodNumber>;
    hasOpenAdminReview: z.ZodOptional<z.ZodBoolean>;
    activities: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        action: z.ZodString;
        actorEmail: z.ZodNullable<z.ZodString>;
        actorName: z.ZodNullable<z.ZodString>;
        actorJobTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        actorLabel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        summary: z.ZodString;
        createdAt: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type ClientProjectSummary = z.infer<typeof ClientProjectSummarySchema>;
export declare const ProjectRequestItemSchema: z.ZodObject<{
    id: z.ZodString;
    projectId: z.ZodString;
    projectTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    type: z.ZodEnum<{
        PROGRESS: "PROGRESS";
        ONBOARDING: "ONBOARDING";
        CANCELLATION: "CANCELLATION";
    }>;
    status: z.ZodEnum<{
        OPEN: "OPEN";
        IN_PROGRESS: "IN_PROGRESS";
        RESOLVED: "RESOLVED";
        REJECTED: "REJECTED";
        CANCELLED: "CANCELLED";
    }>;
    title: z.ZodString;
    description: z.ZodString;
    targetPhase: z.ZodNullable<z.ZodEnum<{
        IN_PROGRESS: "IN_PROGRESS";
        DISCOVERY: "DISCOVERY";
        CLIENT_REVIEW: "CLIENT_REVIEW";
        READY_FOR_DELIVERY: "READY_FOR_DELIVERY";
        DELIVERED: "DELIVERED";
    }>>;
    cancellationOutcome: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    cancellationFeeAmount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    cancellationFeeNotes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    messages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        requestId: z.ZodString;
        authorUserId: z.ZodString;
        authorEmail: z.ZodNullable<z.ZodString>;
        authorDisplayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        authorJobTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        body: z.ZodString;
        messageKind: z.ZodOptional<z.ZodEnum<{
            CHAT: "CHAT";
            CHECKPOINT: "CHECKPOINT";
        }>>;
        checkpointTargetPhase: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
            IN_PROGRESS: "IN_PROGRESS";
            DISCOVERY: "DISCOVERY";
            CLIENT_REVIEW: "CLIENT_REVIEW";
            READY_FOR_DELIVERY: "READY_FOR_DELIVERY";
            DELIVERED: "DELIVERED";
        }>>>;
        requiresClientApproval: z.ZodOptional<z.ZodBoolean>;
        clientApprovedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        supersededAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        isPendingApproval: z.ZodOptional<z.ZodBoolean>;
        createdAt: z.ZodString;
        attachmentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            projectId: z.ZodString;
            requestId: z.ZodNullable<z.ZodString>;
            fileName: z.ZodString;
            mimeType: z.ZodString;
            sizeBytes: z.ZodNumber;
            createdAt: z.ZodString;
        }, z.core.$strip>>>;
        authorRole: z.ZodEnum<{
            ADMIN: "ADMIN";
            CLIENT: "CLIENT";
        }>;
    }, z.core.$strip>>>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        projectId: z.ZodString;
        requestId: z.ZodNullable<z.ZodString>;
        fileName: z.ZodString;
        mimeType: z.ZodString;
        sizeBytes: z.ZodNumber;
        createdAt: z.ZodString;
    }, z.core.$strip>>>;
    messageCount: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type ProjectRequestItem = z.infer<typeof ProjectRequestItemSchema>;
export declare const ClientApprovalRecordItemSchema: z.ZodObject<{
    id: z.ZodString;
    projectId: z.ZodString;
    projectTitle: z.ZodOptional<z.ZodString>;
    requestId: z.ZodString;
    messageId: z.ZodString;
    title: z.ZodString;
    summary: z.ZodNullable<z.ZodString>;
    targetPhase: z.ZodNullable<z.ZodEnum<{
        IN_PROGRESS: "IN_PROGRESS";
        DISCOVERY: "DISCOVERY";
        CLIENT_REVIEW: "CLIENT_REVIEW";
        READY_FOR_DELIVERY: "READY_FOR_DELIVERY";
        DELIVERED: "DELIVERED";
    }>>;
    approvedAt: z.ZodString;
}, z.core.$strip>;
export type ClientApprovalRecordItem = z.infer<typeof ClientApprovalRecordItemSchema>;
export declare const ClientProjectDetailSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    status: z.ZodEnum<{
        ACTIVE: "ACTIVE";
        CANCELLED: "CANCELLED";
        SUBMITTED: "SUBMITTED";
        ON_HOLD: "ON_HOLD";
        COMPLETED: "COMPLETED";
    }>;
    statusLabel: z.ZodOptional<z.ZodString>;
    phase: z.ZodEnum<{
        IN_PROGRESS: "IN_PROGRESS";
        DISCOVERY: "DISCOVERY";
        CLIENT_REVIEW: "CLIENT_REVIEW";
        READY_FOR_DELIVERY: "READY_FOR_DELIVERY";
        DELIVERED: "DELIVERED";
    }>;
    approvedByEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    approvedByName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    approvedByJobTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    approvedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    completedByEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    completedByName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    completedByJobTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    completedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    coverImageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    pendingCheckpointCount: z.ZodOptional<z.ZodNumber>;
    hasPendingCheckpoint: z.ZodOptional<z.ZodBoolean>;
    openAdminReviewCount: z.ZodOptional<z.ZodNumber>;
    hasOpenAdminReview: z.ZodOptional<z.ZodBoolean>;
    requests: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        projectId: z.ZodString;
        projectTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        type: z.ZodEnum<{
            PROGRESS: "PROGRESS";
            ONBOARDING: "ONBOARDING";
            CANCELLATION: "CANCELLATION";
        }>;
        status: z.ZodEnum<{
            OPEN: "OPEN";
            IN_PROGRESS: "IN_PROGRESS";
            RESOLVED: "RESOLVED";
            REJECTED: "REJECTED";
            CANCELLED: "CANCELLED";
        }>;
        title: z.ZodString;
        description: z.ZodString;
        targetPhase: z.ZodNullable<z.ZodEnum<{
            IN_PROGRESS: "IN_PROGRESS";
            DISCOVERY: "DISCOVERY";
            CLIENT_REVIEW: "CLIENT_REVIEW";
            READY_FOR_DELIVERY: "READY_FOR_DELIVERY";
            DELIVERED: "DELIVERED";
        }>>;
        cancellationOutcome: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        cancellationFeeAmount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        cancellationFeeNotes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdAt: z.ZodString;
        messages: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            requestId: z.ZodString;
            authorUserId: z.ZodString;
            authorEmail: z.ZodNullable<z.ZodString>;
            authorDisplayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            authorJobTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            body: z.ZodString;
            messageKind: z.ZodOptional<z.ZodEnum<{
                CHAT: "CHAT";
                CHECKPOINT: "CHECKPOINT";
            }>>;
            checkpointTargetPhase: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
                IN_PROGRESS: "IN_PROGRESS";
                DISCOVERY: "DISCOVERY";
                CLIENT_REVIEW: "CLIENT_REVIEW";
                READY_FOR_DELIVERY: "READY_FOR_DELIVERY";
                DELIVERED: "DELIVERED";
            }>>>;
            requiresClientApproval: z.ZodOptional<z.ZodBoolean>;
            clientApprovedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            supersededAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            isPendingApproval: z.ZodOptional<z.ZodBoolean>;
            createdAt: z.ZodString;
            attachmentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
            attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                projectId: z.ZodString;
                requestId: z.ZodNullable<z.ZodString>;
                fileName: z.ZodString;
                mimeType: z.ZodString;
                sizeBytes: z.ZodNumber;
                createdAt: z.ZodString;
            }, z.core.$strip>>>;
            authorRole: z.ZodEnum<{
                ADMIN: "ADMIN";
                CLIENT: "CLIENT";
            }>;
        }, z.core.$strip>>>;
        attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            projectId: z.ZodString;
            requestId: z.ZodNullable<z.ZodString>;
            fileName: z.ZodString;
            mimeType: z.ZodString;
            sizeBytes: z.ZodNumber;
            createdAt: z.ZodString;
        }, z.core.$strip>>>;
        messageCount: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        projectId: z.ZodString;
        requestId: z.ZodNullable<z.ZodString>;
        fileName: z.ZodString;
        mimeType: z.ZodString;
        sizeBytes: z.ZodNumber;
        createdAt: z.ZodString;
    }, z.core.$strip>>>;
    activities: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        action: z.ZodString;
        actorEmail: z.ZodNullable<z.ZodString>;
        actorName: z.ZodNullable<z.ZodString>;
        actorJobTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        actorLabel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        summary: z.ZodString;
        createdAt: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type ClientProjectDetail = z.infer<typeof ClientProjectDetailSchema>;
export declare const ClientDashboardStatsSchema: z.ZodObject<{
    activeProjects: z.ZodNumber;
    activeProjectsAwaitingReview: z.ZodNumber;
    pendingApprovals: z.ZodNumber;
    sharedFiles: z.ZodNumber;
    lastSharedFileAt: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type ClientDashboardStats = z.infer<typeof ClientDashboardStatsSchema>;
export declare const PortalNotificationItemSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    title: z.ZodString;
    body: z.ZodString;
    href: z.ZodNullable<z.ZodString>;
    readAt: z.ZodNullable<z.ZodString>;
    projectId: z.ZodNullable<z.ZodString>;
    requestId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
}, z.core.$strip>;
export type PortalNotificationItem = z.infer<typeof PortalNotificationItemSchema>;
export { ClientFilesLibrarySchema, ClientProjectPhaseSchema, ClientProjectStatusSchema, ProjectActivitySchema, ProjectAttachmentSchema, ProjectAttachmentWithUsageSchema, ProjectFilesGroupSchema, ProjectRequestStatusSchema, } from './shared/projects';
export type { ClientFilesLibrary, ClientProjectPhase, ClientProjectStatus, ProjectActivity, ProjectAttachment, ProjectAttachmentWithUsage, ProjectFilesGroup, ProjectRequestStatus, } from './shared/projects';
