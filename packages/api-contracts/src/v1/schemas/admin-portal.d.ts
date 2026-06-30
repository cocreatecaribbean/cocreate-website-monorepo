import { z } from 'zod';
export declare const ProjectRequestTypeSchema: z.ZodEnum<{
    INTERNAL: "INTERNAL";
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
        COLLABORATOR: "COLLABORATOR";
        CLIENT: "CLIENT";
    }>;
}, z.core.$strip>;
export type ProjectRequestMessage = z.infer<typeof ProjectRequestMessageSchema>;
export declare const FilesQuerySchema: z.ZodObject<{
    projectId: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    visibility: z.ZodOptional<z.ZodEnum<{
        CLIENT: "CLIENT";
        INTERNAL: "INTERNAL";
    }>>;
}, z.core.$strip>;
export type FilesQuery = z.infer<typeof FilesQuerySchema>;
export declare const ProjectRequestItemSchema: z.ZodObject<{
    id: z.ZodString;
    projectId: z.ZodString;
    projectTitle: z.ZodNullable<z.ZodString>;
    organizationId: z.ZodNullable<z.ZodString>;
    organizationName: z.ZodNullable<z.ZodString>;
    type: z.ZodEnum<{
        INTERNAL: "INTERNAL";
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
    createdByEmail: z.ZodNullable<z.ZodString>;
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
            COLLABORATOR: "COLLABORATOR";
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
export declare const ProjectActivityItemSchema: z.ZodObject<{
    id: z.ZodString;
    projectId: z.ZodString;
    projectTitle: z.ZodString;
    action: z.ZodString;
    actorEmail: z.ZodString;
    actorName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    actorJobTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    actorLabel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    summary: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
}, z.core.$strip>;
export type ProjectActivityItem = z.infer<typeof ProjectActivityItemSchema>;
export declare const ClientProjectSummarySchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    organizationName: z.ZodNullable<z.ZodString>;
    title: z.ZodString;
    description: z.ZodString;
    status: z.ZodEnum<{
        ACTIVE: "ACTIVE";
        CANCELLED: "CANCELLED";
        SUBMITTED: "SUBMITTED";
        ON_HOLD: "ON_HOLD";
        COMPLETED: "COMPLETED";
    }>;
    phase: z.ZodEnum<{
        IN_PROGRESS: "IN_PROGRESS";
        DISCOVERY: "DISCOVERY";
        CLIENT_REVIEW: "CLIENT_REVIEW";
        READY_FOR_DELIVERY: "READY_FOR_DELIVERY";
        DELIVERED: "DELIVERED";
    }>;
    createdByEmail: z.ZodNullable<z.ZodString>;
    approvedAt: z.ZodNullable<z.ZodString>;
    approvedByEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    approvedByName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    approvedByJobTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    statusLabel: z.ZodOptional<z.ZodString>;
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
    openCancellationCount: z.ZodOptional<z.ZodNumber>;
    hasOpenCancellation: z.ZodOptional<z.ZodBoolean>;
    requests: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        projectId: z.ZodString;
        projectTitle: z.ZodNullable<z.ZodString>;
        organizationId: z.ZodNullable<z.ZodString>;
        organizationName: z.ZodNullable<z.ZodString>;
        type: z.ZodEnum<{
            INTERNAL: "INTERNAL";
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
        createdByEmail: z.ZodNullable<z.ZodString>;
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
                COLLABORATOR: "COLLABORATOR";
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
    activities: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        projectId: z.ZodString;
        projectTitle: z.ZodString;
        action: z.ZodString;
        actorEmail: z.ZodString;
        actorName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        actorJobTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        actorLabel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        summary: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type ClientProjectSummary = z.infer<typeof ClientProjectSummarySchema>;
export declare const OrganizationBrandAssetSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    fileName: z.ZodString;
    mimeType: z.ZodString;
    sizeBytes: z.ZodNumber;
    uploadedByUserId: z.ZodString;
    uploadedByEmail: z.ZodNullable<z.ZodString>;
    uploadedByName: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
}, z.core.$strip>;
export type OrganizationBrandAsset = z.infer<typeof OrganizationBrandAssetSchema>;
export declare const PortalUserStatusSchema: z.ZodEnum<{
    INVITED: "INVITED";
    ACTIVE: "ACTIVE";
}>;
export type PortalUserStatus = z.infer<typeof PortalUserStatusSchema>;
export declare const OrganizationPortalUserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    status: z.ZodEnum<{
        INVITED: "INVITED";
        ACTIVE: "ACTIVE";
    }>;
    clientOrgRole: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type OrganizationPortalUser = z.infer<typeof OrganizationPortalUserSchema>;
export declare const OrganizationPortalStatusSchema: z.ZodObject<{
    hasActiveUsers: z.ZodBoolean;
    hasPortalUsers: z.ZodBoolean;
    needsInvite: z.ZodBoolean;
    activeUserCount: z.ZodNumber;
    invitedUsers: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
    }, z.core.$strip>>;
    suggestedContactEmail: z.ZodNullable<z.ZodString>;
    portalUsers: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        status: z.ZodEnum<{
            INVITED: "INVITED";
            ACTIVE: "ACTIVE";
        }>;
        clientOrgRole: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type OrganizationPortalStatus = z.infer<typeof OrganizationPortalStatusSchema>;
export declare const CreateProjectForAdminPayloadSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    recipientUserIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    inviteEmails: z.ZodOptional<z.ZodArray<z.ZodString>>;
    contactEmail: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateProjectForAdminPayload = z.infer<typeof CreateProjectForAdminPayloadSchema>;
export declare const CreateProjectForAdminResultSchema: z.ZodObject<{
    project: z.ZodObject<{
        id: z.ZodString;
        organizationId: z.ZodString;
        organizationName: z.ZodNullable<z.ZodString>;
        title: z.ZodString;
        description: z.ZodString;
        status: z.ZodEnum<{
            ACTIVE: "ACTIVE";
            CANCELLED: "CANCELLED";
            SUBMITTED: "SUBMITTED";
            ON_HOLD: "ON_HOLD";
            COMPLETED: "COMPLETED";
        }>;
        phase: z.ZodEnum<{
            IN_PROGRESS: "IN_PROGRESS";
            DISCOVERY: "DISCOVERY";
            CLIENT_REVIEW: "CLIENT_REVIEW";
            READY_FOR_DELIVERY: "READY_FOR_DELIVERY";
            DELIVERED: "DELIVERED";
        }>;
        createdByEmail: z.ZodNullable<z.ZodString>;
        approvedAt: z.ZodNullable<z.ZodString>;
        approvedByEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        approvedByName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        approvedByJobTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        statusLabel: z.ZodOptional<z.ZodString>;
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
        openCancellationCount: z.ZodOptional<z.ZodNumber>;
        hasOpenCancellation: z.ZodOptional<z.ZodBoolean>;
        requests: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            projectId: z.ZodString;
            projectTitle: z.ZodNullable<z.ZodString>;
            organizationId: z.ZodNullable<z.ZodString>;
            organizationName: z.ZodNullable<z.ZodString>;
            type: z.ZodEnum<{
                INTERNAL: "INTERNAL";
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
            createdByEmail: z.ZodNullable<z.ZodString>;
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
                    COLLABORATOR: "COLLABORATOR";
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
        activities: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            projectId: z.ZodString;
            projectTitle: z.ZodString;
            action: z.ZodString;
            actorEmail: z.ZodString;
            actorName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            actorJobTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            actorLabel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            summary: z.ZodOptional<z.ZodString>;
            createdAt: z.ZodString;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
    portalActions: z.ZodObject<{
        notifiedActiveCount: z.ZodNumber;
        inviteRemindersSent: z.ZodNumber;
        newInvitesSent: z.ZodNumber;
        invitedEmails: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type CreateProjectForAdminResult = z.infer<typeof CreateProjectForAdminResultSchema>;
export declare const AdminDashboardStatsSchema: z.ZodObject<{
    activeClients: z.ZodNumber;
    activeClientsThisMonth: z.ZodNumber;
    openProjects: z.ZodNumber;
    projectsAwaitingApproval: z.ZodNumber;
    portalInvites: z.ZodNumber;
    socialListeningSubscribers: z.ZodNumber;
    socialListeningConfigured: z.ZodNumber;
}, z.core.$strip>;
export type AdminDashboardStats = z.infer<typeof AdminDashboardStatsSchema>;
export declare const AdminRecentActivityItemSchema: z.ZodObject<{
    id: z.ZodString;
    projectId: z.ZodString;
    projectTitle: z.ZodString;
    organizationId: z.ZodString;
    organizationName: z.ZodString;
    action: z.ZodString;
    summary: z.ZodOptional<z.ZodString>;
    actorEmail: z.ZodNullable<z.ZodString>;
    actorName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    actorJobTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    actorLabel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    href: z.ZodString;
}, z.core.$strip>;
export type AdminRecentActivityItem = z.infer<typeof AdminRecentActivityItemSchema>;
export declare const AdminRosterItemSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    role: z.ZodEnum<{
        SUPER_ADMIN: "SUPER_ADMIN";
        ADMIN: "ADMIN";
    }>;
    status: z.ZodEnum<{
        INVITED: "INVITED";
        ACTIVE: "ACTIVE";
        SUSPENDED: "SUSPENDED";
    }>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$strip>;
export type AdminRosterItem = z.infer<typeof AdminRosterItemSchema>;
export declare const ClientPrimaryContactSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    status: z.ZodEnum<{
        INVITED: "INVITED";
        ACTIVE: "ACTIVE";
        SUSPENDED: "SUSPENDED";
    }>;
    clientOrgRole: z.ZodNullable<z.ZodEnum<{
        OWNER: "OWNER";
        PROJECT_MANAGER: "PROJECT_MANAGER";
        MEMBER: "MEMBER";
    }>>;
    canAccessSocialListening: z.ZodBoolean;
}, z.core.$strip>;
export type ClientPrimaryContact = z.infer<typeof ClientPrimaryContactSchema>;
export declare const ClientOrganizationRosterItemSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    logoUrl: z.ZodNullable<z.ZodString>;
    isSocialListeningSubscriber: z.ZodBoolean;
    brand24ProjectId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    primaryContact: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        status: z.ZodEnum<{
            INVITED: "INVITED";
            ACTIVE: "ACTIVE";
            SUSPENDED: "SUSPENDED";
        }>;
        clientOrgRole: z.ZodNullable<z.ZodEnum<{
            OWNER: "OWNER";
            PROJECT_MANAGER: "PROJECT_MANAGER";
            MEMBER: "MEMBER";
        }>>;
        canAccessSocialListening: z.ZodBoolean;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ClientOrganizationRosterItem = z.infer<typeof ClientOrganizationRosterItemSchema>;
export declare const ClientRosterItemSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    logoUrl: z.ZodNullable<z.ZodString>;
    isSocialListeningSubscriber: z.ZodBoolean;
    brand24ProjectId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    primaryContact: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        status: z.ZodEnum<{
            INVITED: "INVITED";
            ACTIVE: "ACTIVE";
            SUSPENDED: "SUSPENDED";
        }>;
        clientOrgRole: z.ZodNullable<z.ZodEnum<{
            OWNER: "OWNER";
            PROJECT_MANAGER: "PROJECT_MANAGER";
            MEMBER: "MEMBER";
        }>>;
        canAccessSocialListening: z.ZodBoolean;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ClientRosterItem = ClientOrganizationRosterItem;
export declare const InviteClientResultSchema: z.ZodObject<{
    organization: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        slug: z.ZodString;
        logoUrl: z.ZodNullable<z.ZodString>;
        isSocialListeningSubscriber: z.ZodBoolean;
        brand24ProjectId: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>;
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        status: z.ZodEnum<{
            INVITED: "INVITED";
            ACTIVE: "ACTIVE";
            SUSPENDED: "SUSPENDED";
        }>;
        clientOrgRole: z.ZodNullable<z.ZodEnum<{
            OWNER: "OWNER";
            PROJECT_MANAGER: "PROJECT_MANAGER";
            MEMBER: "MEMBER";
        }>>;
        canAccessSocialListening: z.ZodBoolean;
        role: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, z.core.$strip>;
    invitation: z.ZodObject<{
        provider: z.ZodLiteral<"supabase-auth">;
        status: z.ZodEnum<{
            sent: "sent";
            stubbed: "stubbed";
            dev_link: "dev_link";
        }>;
        invitationId: z.ZodString;
        devSignInUrl: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type InviteClientResult = z.infer<typeof InviteClientResultSchema>;
export declare const CollaboratorRosterItemSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    status: z.ZodEnum<{
        INVITED: "INVITED";
        ACTIVE: "ACTIVE";
        SUSPENDED: "SUSPENDED";
    }>;
    createdAt: z.ZodString;
    projects: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        organizationId: z.ZodString;
        organizationName: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CollaboratorRosterItem = z.infer<typeof CollaboratorRosterItemSchema>;
export declare const ProjectCollaboratorRowSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    email: z.ZodString;
    status: z.ZodString;
    grantedByEmail: z.ZodString;
    createdAt: z.ZodString;
}, z.core.$strip>;
export type ProjectCollaboratorRow = z.infer<typeof ProjectCollaboratorRowSchema>;
export declare const ProjectCollaboratorRosterItemSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    status: z.ZodString;
    projects: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ProjectCollaboratorRosterItem = z.infer<typeof ProjectCollaboratorRosterItemSchema>;
export declare const AdminProfileSchema: z.ZodObject<{
    displayName: z.ZodNullable<z.ZodString>;
    jobTitle: z.ZodNullable<z.ZodString>;
    jobTitleLabels: z.ZodArray<z.ZodString>;
    jobTitleOptionIds: z.ZodArray<z.ZodString>;
    avatarUrl: z.ZodNullable<z.ZodString>;
    email: z.ZodString;
    profileComplete: z.ZodBoolean;
    updatedAt: z.ZodString;
}, z.core.$strip>;
export type AdminProfile = z.infer<typeof AdminProfileSchema>;
export declare const ProfileOptionSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
}, z.core.$strip>;
export type ProfileOption = z.infer<typeof ProfileOptionSchema>;
export declare const JobTitleOptionSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    sortOrder: z.ZodNumber;
    isActive: z.ZodBoolean;
}, z.core.$strip>;
export type JobTitleOption = z.infer<typeof JobTitleOptionSchema>;
export declare const TeamMemberSummarySchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    status: z.ZodString;
    clientOrgRole: z.ZodNullable<z.ZodEnum<{
        OWNER: "OWNER";
        PROJECT_MANAGER: "PROJECT_MANAGER";
        MEMBER: "MEMBER";
    }>>;
    canAccessSocialListening: z.ZodBoolean;
}, z.core.$strip>;
export type TeamMemberSummary = z.infer<typeof TeamMemberSummarySchema>;
export declare const TeamMemberSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    status: z.ZodString;
    clientOrgRole: z.ZodNullable<z.ZodEnum<{
        OWNER: "OWNER";
        PROJECT_MANAGER: "PROJECT_MANAGER";
        MEMBER: "MEMBER";
    }>>;
    canAccessSocialListening: z.ZodBoolean;
}, z.core.$strip>;
export type TeamMember = TeamMemberSummary;
export declare const TeamInviteRequestSummarySchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    requestedClientOrgRole: z.ZodEnum<{
        OWNER: "OWNER";
        PROJECT_MANAGER: "PROJECT_MANAGER";
        MEMBER: "MEMBER";
    }>;
    status: z.ZodString;
    requestedByEmail: z.ZodString;
    createdAt: z.ZodString;
}, z.core.$strip>;
export type TeamInviteRequestSummary = z.infer<typeof TeamInviteRequestSummarySchema>;
export declare const InviteRequestSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    requestedClientOrgRole: z.ZodEnum<{
        OWNER: "OWNER";
        PROJECT_MANAGER: "PROJECT_MANAGER";
        MEMBER: "MEMBER";
    }>;
    status: z.ZodString;
    requestedByEmail: z.ZodString;
    createdAt: z.ZodString;
}, z.core.$strip>;
export type InviteRequest = TeamInviteRequestSummary;
export declare const CollaboratorMeSchema: z.ZodObject<{
    ok: z.ZodLiteral<true>;
    collaborator: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
    }, z.core.$strip>;
    projects: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        organizationName: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CollaboratorMe = z.infer<typeof CollaboratorMeSchema>;
export declare const SlAdminStatsSchema: z.ZodObject<{
    active: z.ZodNumber;
    pending: z.ZodNumber;
    expiringSoon: z.ZodNumber;
    noSetup: z.ZodNumber;
}, z.core.$strip>;
export type SlAdminStats = z.infer<typeof SlAdminStatsSchema>;
export declare const SlAdminSubscriptionSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    plan: z.ZodString;
    status: z.ZodString;
    startedAt: z.ZodNullable<z.ZodString>;
    currentPeriodEnd: z.ZodNullable<z.ZodString>;
    autoRenewEnabled: z.ZodBoolean;
    billingSource: z.ZodString;
    organization: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        slug: z.ZodString;
        brand24ProjectId: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type SlAdminSubscription = z.infer<typeof SlAdminSubscriptionSchema>;
export declare const SlPaymentEventSchema: z.ZodObject<{
    id: z.ZodString;
    eventType: z.ZodString;
    amount: z.ZodString;
    currency: z.ZodString;
    processedAt: z.ZodString;
}, z.core.$strip>;
export type SlPaymentEvent = z.infer<typeof SlPaymentEventSchema>;
export declare const SlBillingEmailLogSchema: z.ZodObject<{
    id: z.ZodString;
    emailType: z.ZodString;
    sentAt: z.ZodString;
    recipientEmail: z.ZodString;
}, z.core.$strip>;
export type SlBillingEmailLog = z.infer<typeof SlBillingEmailLogSchema>;
export declare const SlListeningSetupSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    brand24ProjectId: z.ZodNullable<z.ZodString>;
    createdBy: z.ZodString;
    createdAt: z.ZodString;
}, z.core.$strip>;
export type SlListeningSetup = z.infer<typeof SlListeningSetupSchema>;
export declare const SlSubscriptionDetailSchema: z.ZodObject<{
    id: z.ZodString;
    plan: z.ZodString;
    status: z.ZodString;
    startedAt: z.ZodNullable<z.ZodString>;
    currentPeriodEnd: z.ZodNullable<z.ZodString>;
    autoRenewEnabled: z.ZodBoolean;
    cancelAtPeriodEnd: z.ZodBoolean;
    billingSource: z.ZodString;
    paymentMethodLast4: z.ZodNullable<z.ZodString>;
    paymentMethodBrand: z.ZodNullable<z.ZodString>;
    paymentEvents: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        eventType: z.ZodString;
        amount: z.ZodString;
        currency: z.ZodString;
        processedAt: z.ZodString;
    }, z.core.$strip>>;
    billingEmailLogs: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        emailType: z.ZodString;
        sentAt: z.ZodString;
        recipientEmail: z.ZodString;
    }, z.core.$strip>>;
    organization: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        slug: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type SlSubscriptionDetail = z.infer<typeof SlSubscriptionDetailSchema>;
export declare const SlSubscriptionDetailResponseSchema: z.ZodObject<{
    subscription: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        plan: z.ZodString;
        status: z.ZodString;
        startedAt: z.ZodNullable<z.ZodString>;
        currentPeriodEnd: z.ZodNullable<z.ZodString>;
        autoRenewEnabled: z.ZodBoolean;
        cancelAtPeriodEnd: z.ZodBoolean;
        billingSource: z.ZodString;
        paymentMethodLast4: z.ZodNullable<z.ZodString>;
        paymentMethodBrand: z.ZodNullable<z.ZodString>;
        paymentEvents: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            eventType: z.ZodString;
            amount: z.ZodString;
            currency: z.ZodString;
            processedAt: z.ZodString;
        }, z.core.$strip>>;
        billingEmailLogs: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            emailType: z.ZodString;
            sentAt: z.ZodString;
            recipientEmail: z.ZodString;
        }, z.core.$strip>>;
        organization: z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            slug: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strip>>;
    setups: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        status: z.ZodString;
        startDate: z.ZodString;
        endDate: z.ZodString;
        brand24ProjectId: z.ZodNullable<z.ZodString>;
        createdBy: z.ZodString;
        createdAt: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type SlSubscriptionDetailResponse = z.infer<typeof SlSubscriptionDetailResponseSchema>;
export declare const SlSubscriptionSummaryResponseSchema: z.ZodObject<{
    subscription: z.ZodNullable<z.ZodObject<{
        organization: z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            slug: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type SlSubscriptionSummaryResponse = z.infer<typeof SlSubscriptionSummaryResponseSchema>;
export declare const ClientRosterOptionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
}, z.core.$strip>;
export type ClientRosterOption = z.infer<typeof ClientRosterOptionSchema>;
export declare const ClientRowSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
export type ClientRow = z.infer<typeof ClientRowSchema>;
export { ClientFilesLibrarySchema, ClientProjectPhaseSchema, ClientProjectStatusSchema, ProjectAttachmentSchema, ProjectAttachmentWithUsageSchema, ProjectFilesGroupSchema, ProjectRequestStatusSchema, } from './shared/projects';
export type { ClientFilesLibrary, ClientProjectPhase, ClientProjectStatus, ProjectAttachment, ProjectAttachmentWithUsage, ProjectFilesGroup, ProjectRequestStatus, } from './shared/projects';
