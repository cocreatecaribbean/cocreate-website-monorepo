import { z } from 'zod';
export declare const ClientProjectStatusSchema: z.ZodEnum<{
    ACTIVE: "ACTIVE";
    CANCELLED: "CANCELLED";
    SUBMITTED: "SUBMITTED";
    ON_HOLD: "ON_HOLD";
    COMPLETED: "COMPLETED";
}>;
export type ClientProjectStatus = z.infer<typeof ClientProjectStatusSchema>;
export declare const ClientProjectPhaseSchema: z.ZodEnum<{
    IN_PROGRESS: "IN_PROGRESS";
    DISCOVERY: "DISCOVERY";
    CLIENT_REVIEW: "CLIENT_REVIEW";
    READY_FOR_DELIVERY: "READY_FOR_DELIVERY";
    DELIVERED: "DELIVERED";
}>;
export type ClientProjectPhase = z.infer<typeof ClientProjectPhaseSchema>;
export declare const ProjectRequestStatusSchema: z.ZodEnum<{
    OPEN: "OPEN";
    IN_PROGRESS: "IN_PROGRESS";
    RESOLVED: "RESOLVED";
    REJECTED: "REJECTED";
    CANCELLED: "CANCELLED";
}>;
export type ProjectRequestStatus = z.infer<typeof ProjectRequestStatusSchema>;
export declare const ProjectAttachmentSchema: z.ZodObject<{
    id: z.ZodString;
    projectId: z.ZodString;
    requestId: z.ZodNullable<z.ZodString>;
    fileName: z.ZodString;
    mimeType: z.ZodString;
    sizeBytes: z.ZodNumber;
    createdAt: z.ZodString;
}, z.core.$strip>;
export type ProjectAttachment = z.infer<typeof ProjectAttachmentSchema>;
export declare const ProjectRequestMessageBaseSchema: z.ZodObject<{
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
}, z.core.$strip>;
export type ProjectRequestMessageBase = z.infer<typeof ProjectRequestMessageBaseSchema>;
export declare const ProjectActivitySchema: z.ZodObject<{
    id: z.ZodString;
    action: z.ZodString;
    actorEmail: z.ZodNullable<z.ZodString>;
    actorName: z.ZodNullable<z.ZodString>;
    actorJobTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    actorLabel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    summary: z.ZodString;
    createdAt: z.ZodString;
}, z.core.$strip>;
export type ProjectActivity = z.infer<typeof ProjectActivitySchema>;
export declare const ProjectAttachmentWithUsageSchema: z.ZodObject<{
    id: z.ZodString;
    projectId: z.ZodString;
    requestId: z.ZodNullable<z.ZodString>;
    fileName: z.ZodString;
    mimeType: z.ZodString;
    sizeBytes: z.ZodNumber;
    createdAt: z.ZodString;
    usedInThreads: z.ZodBoolean;
    messageRefsCount: z.ZodNumber;
    lastUsedAt: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type ProjectAttachmentWithUsage = z.infer<typeof ProjectAttachmentWithUsageSchema>;
export declare const ProjectFilesGroupSchema: z.ZodObject<{
    projectId: z.ZodString;
    projectTitle: z.ZodString;
    libraryUploads: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        projectId: z.ZodString;
        requestId: z.ZodNullable<z.ZodString>;
        fileName: z.ZodString;
        mimeType: z.ZodString;
        sizeBytes: z.ZodNumber;
        createdAt: z.ZodString;
        usedInThreads: z.ZodBoolean;
        messageRefsCount: z.ZodNumber;
        lastUsedAt: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    usedInThreads: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        projectId: z.ZodString;
        requestId: z.ZodNullable<z.ZodString>;
        fileName: z.ZodString;
        mimeType: z.ZodString;
        sizeBytes: z.ZodNumber;
        createdAt: z.ZodString;
        usedInThreads: z.ZodBoolean;
        messageRefsCount: z.ZodNumber;
        lastUsedAt: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ProjectFilesGroup = z.infer<typeof ProjectFilesGroupSchema>;
export declare const ClientFilesLibrarySchema: z.ZodObject<{
    projects: z.ZodArray<z.ZodObject<{
        projectId: z.ZodString;
        projectTitle: z.ZodString;
        libraryUploads: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            projectId: z.ZodString;
            requestId: z.ZodNullable<z.ZodString>;
            fileName: z.ZodString;
            mimeType: z.ZodString;
            sizeBytes: z.ZodNumber;
            createdAt: z.ZodString;
            usedInThreads: z.ZodBoolean;
            messageRefsCount: z.ZodNumber;
            lastUsedAt: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>>;
        usedInThreads: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            projectId: z.ZodString;
            requestId: z.ZodNullable<z.ZodString>;
            fileName: z.ZodString;
            mimeType: z.ZodString;
            sizeBytes: z.ZodNumber;
            createdAt: z.ZodString;
            usedInThreads: z.ZodBoolean;
            messageRefsCount: z.ZodNumber;
            lastUsedAt: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    files: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        projectId: z.ZodString;
        requestId: z.ZodNullable<z.ZodString>;
        fileName: z.ZodString;
        mimeType: z.ZodString;
        sizeBytes: z.ZodNumber;
        createdAt: z.ZodString;
        usedInThreads: z.ZodBoolean;
        messageRefsCount: z.ZodNumber;
        lastUsedAt: z.ZodNullable<z.ZodString>;
        projectTitle: z.ZodString;
    }, z.core.$strip>>>;
    nextCursor: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type ClientFilesLibrary = z.infer<typeof ClientFilesLibrarySchema>;
export declare const FilesQueryBaseSchema: z.ZodObject<{
    projectId: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type FilesQueryBase = z.infer<typeof FilesQueryBaseSchema>;
