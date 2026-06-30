import { z } from 'zod';
export declare const CreateProjectSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
}, z.core.$strip>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export declare const UpdateProjectSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        CANCELLED: "CANCELLED";
        SUBMITTED: "SUBMITTED";
        ON_HOLD: "ON_HOLD";
        COMPLETED: "COMPLETED";
    }>>;
    phase: z.ZodOptional<z.ZodEnum<{
        IN_PROGRESS: "IN_PROGRESS";
        DISCOVERY: "DISCOVERY";
        CLIENT_REVIEW: "CLIENT_REVIEW";
        READY_FOR_DELIVERY: "READY_FOR_DELIVERY";
        DELIVERED: "DELIVERED";
    }>>;
}, z.core.$strip>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export declare const CreateChangeRequestSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
}, z.core.$strip>;
export type CreateChangeRequestInput = z.infer<typeof CreateChangeRequestSchema>;
export declare const CreateReviewRequestSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
}, z.core.$strip>;
export type CreateReviewRequestInput = CreateChangeRequestInput;
export declare const CreateCancellationRequestSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateCancellationRequestInput = z.infer<typeof CreateCancellationRequestSchema>;
export declare const CreatePhaseApprovalSchema: z.ZodObject<{
    targetPhase: z.ZodEnum<{
        IN_PROGRESS: "IN_PROGRESS";
        DISCOVERY: "DISCOVERY";
        CLIENT_REVIEW: "CLIENT_REVIEW";
        READY_FOR_DELIVERY: "READY_FOR_DELIVERY";
        DELIVERED: "DELIVERED";
    }>;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreatePhaseApprovalInput = z.infer<typeof CreatePhaseApprovalSchema>;
export declare const CreateRequestMessageSchema: z.ZodObject<{
    body: z.ZodString;
    attachmentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type CreateRequestMessageInput = z.infer<typeof CreateRequestMessageSchema>;
export declare const UpdateRequestSchema: z.ZodObject<{
    status: z.ZodEnum<{
        OPEN: "OPEN";
        IN_PROGRESS: "IN_PROGRESS";
        RESOLVED: "RESOLVED";
        REJECTED: "REJECTED";
        CANCELLED: "CANCELLED";
    }>;
}, z.core.$strip>;
export type UpdateRequestInput = z.infer<typeof UpdateRequestSchema>;
export declare const ResolveCancellationSchema: z.ZodObject<{
    outcome: z.ZodEnum<{
        APPROVED_NO_FEE: "APPROVED_NO_FEE";
        APPROVED_WITH_FEE: "APPROVED_WITH_FEE";
        DENIED: "DENIED";
    }>;
    feeAmount: z.ZodOptional<z.ZodNumber>;
    feeNotes: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ResolveCancellationInput = z.infer<typeof ResolveCancellationSchema>;
export declare const UploadUrlSchema: z.ZodObject<{
    fileName: z.ZodString;
    mimeType: z.ZodString;
    sizeBytes: z.ZodNumber;
}, z.core.$strip>;
export type UploadUrlInput = z.infer<typeof UploadUrlSchema>;
export declare const StagedCheckpointAttachmentSchema: z.ZodObject<{
    fileName: z.ZodString;
    mimeType: z.ZodString;
    sizeBytes: z.ZodNumber;
    storagePath: z.ZodString;
}, z.core.$strip>;
export type StagedCheckpointAttachmentInput = z.infer<typeof StagedCheckpointAttachmentSchema>;
export declare const CreateCheckpointSchema: z.ZodObject<{
    title: z.ZodString;
    body: z.ZodString;
    reviewUrl: z.ZodOptional<z.ZodString>;
    targetPhase: z.ZodOptional<z.ZodEnum<{
        IN_PROGRESS: "IN_PROGRESS";
        DISCOVERY: "DISCOVERY";
        CLIENT_REVIEW: "CLIENT_REVIEW";
        READY_FOR_DELIVERY: "READY_FOR_DELIVERY";
        DELIVERED: "DELIVERED";
    }>>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        fileName: z.ZodString;
        mimeType: z.ZodString;
        sizeBytes: z.ZodNumber;
        storagePath: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type CreateCheckpointInput = z.infer<typeof CreateCheckpointSchema>;
export declare const RegisterAttachmentSchema: z.ZodObject<{
    fileName: z.ZodString;
    mimeType: z.ZodString;
    sizeBytes: z.ZodNumber;
    storagePath: z.ZodString;
    requestId: z.ZodOptional<z.ZodString>;
    visibility: z.ZodOptional<z.ZodEnum<{
        CLIENT: "CLIENT";
        INTERNAL: "INTERNAL";
    }>>;
}, z.core.$strip>;
export type RegisterAttachmentInput = z.infer<typeof RegisterAttachmentSchema>;
export declare const RegisterCoverSchema: z.ZodObject<{
    storagePath: z.ZodString;
}, z.core.$strip>;
export type RegisterCoverInput = z.infer<typeof RegisterCoverSchema>;
export declare const RegisterBrandAssetSchema: z.ZodObject<{
    fileName: z.ZodString;
    mimeType: z.ZodString;
    sizeBytes: z.ZodNumber;
    storagePath: z.ZodString;
}, z.core.$strip>;
export type RegisterBrandAssetInput = z.infer<typeof RegisterBrandAssetSchema>;
export declare const InviteTeamMemberSchema: z.ZodObject<{
    email: z.ZodString;
    clientOrgRole: z.ZodEnum<{
        OWNER: "OWNER";
        PROJECT_MANAGER: "PROJECT_MANAGER";
        MEMBER: "MEMBER";
    }>;
    canAccessSocialListening: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type InviteTeamMemberInput = z.infer<typeof InviteTeamMemberSchema>;
export declare const RequestTeamInviteSchema: z.ZodObject<{
    email: z.ZodString;
    clientOrgRole: z.ZodEnum<{
        OWNER: "OWNER";
        PROJECT_MANAGER: "PROJECT_MANAGER";
        MEMBER: "MEMBER";
    }>;
}, z.core.$strip>;
export type RequestTeamInviteInput = z.infer<typeof RequestTeamInviteSchema>;
export declare const RejectTeamInviteSchema: z.ZodObject<{
    rejectionReason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type RejectTeamInviteInput = z.infer<typeof RejectTeamInviteSchema>;
export declare const UpdateTeamMemberSchema: z.ZodObject<{
    clientOrgRole: z.ZodOptional<z.ZodEnum<{
        OWNER: "OWNER";
        PROJECT_MANAGER: "PROJECT_MANAGER";
        MEMBER: "MEMBER";
    }>>;
    canAccessSocialListening: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type UpdateTeamMemberInput = z.infer<typeof UpdateTeamMemberSchema>;
export declare const AddProjectMemberSchema: z.ZodObject<{
    email: z.ZodString;
    access: z.ZodEnum<{
        MANAGE: "MANAGE";
        VIEW: "VIEW";
    }>;
}, z.core.$strip>;
export type AddProjectMemberInput = z.infer<typeof AddProjectMemberSchema>;
export declare const InviteAgencyCollaboratorSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type InviteAgencyCollaboratorInput = z.infer<typeof InviteAgencyCollaboratorSchema>;
export declare const CreateAgencyCollaboratorSchema: z.ZodObject<{
    email: z.ZodString;
    projectIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type CreateAgencyCollaboratorInput = z.infer<typeof CreateAgencyCollaboratorSchema>;
export declare const CreateProjectForAdminSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    recipientUserIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    inviteEmails: z.ZodOptional<z.ZodArray<z.ZodString>>;
    contactEmail: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateProjectForAdminInput = z.infer<typeof CreateProjectForAdminSchema>;
export declare const MarkAttentionReadSchema: z.ZodObject<{
    requestId: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type MarkAttentionReadInput = z.infer<typeof MarkAttentionReadSchema>;
export declare const MarkInboxReadSchema: z.ZodObject<{
    requestId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type MarkInboxReadInput = z.infer<typeof MarkInboxReadSchema>;
