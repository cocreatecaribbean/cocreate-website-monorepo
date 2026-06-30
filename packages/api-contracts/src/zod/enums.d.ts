import { z } from 'zod';
export declare const ClientOrgRoleSchema: z.ZodEnum<{
    OWNER: "OWNER";
    PROJECT_MANAGER: "PROJECT_MANAGER";
    MEMBER: "MEMBER";
}>;
export type ClientOrgRole = z.infer<typeof ClientOrgRoleSchema>;
export declare const ClientProjectAccessLevelSchema: z.ZodEnum<{
    MANAGE: "MANAGE";
    VIEW: "VIEW";
}>;
export type ClientProjectAccessLevel = z.infer<typeof ClientProjectAccessLevelSchema>;
export declare const ProjectRequestStatusSchema: z.ZodEnum<{
    OPEN: "OPEN";
    IN_PROGRESS: "IN_PROGRESS";
    RESOLVED: "RESOLVED";
    REJECTED: "REJECTED";
    CANCELLED: "CANCELLED";
}>;
export type ProjectRequestStatusWire = z.infer<typeof ProjectRequestStatusSchema>;
export declare const ProjectAttachmentVisibilitySchema: z.ZodEnum<{
    CLIENT: "CLIENT";
    INTERNAL: "INTERNAL";
}>;
export type ProjectAttachmentVisibility = z.infer<typeof ProjectAttachmentVisibilitySchema>;
export declare const CancellationOutcomeSchema: z.ZodEnum<{
    APPROVED_NO_FEE: "APPROVED_NO_FEE";
    APPROVED_WITH_FEE: "APPROVED_WITH_FEE";
    DENIED: "DENIED";
}>;
export type CancellationOutcomeWire = z.infer<typeof CancellationOutcomeSchema>;
export declare const UserRoleSchema: z.ZodEnum<{
    SUPER_ADMIN: "SUPER_ADMIN";
    ADMIN: "ADMIN";
    COLLABORATOR: "COLLABORATOR";
    CLIENT: "CLIENT";
}>;
export type UserRoleWire = z.infer<typeof UserRoleSchema>;
export declare const AdminAssignableRoleSchema: z.ZodEnum<{
    SUPER_ADMIN: "SUPER_ADMIN";
    ADMIN: "ADMIN";
}>;
export declare const SocialListeningPlanSchema: z.ZodEnum<{
    PULSE: "PULSE";
    GROWTH: "GROWTH";
    SCALE: "SCALE";
}>;
export declare const SocialListeningPlanIdSchema: z.ZodEnum<{
    pulse: "pulse";
    growth: "growth";
    scale: "scale";
}>;
export declare const SocialListeningBillingSourceSchema: z.ZodEnum<{
    FYGARO: "FYGARO";
    ADMIN_COMP: "ADMIN_COMP";
    ADMIN_MANUAL: "ADMIN_MANUAL";
}>;
export type SocialListeningBillingSourceWire = z.infer<typeof SocialListeningBillingSourceSchema>;
export declare const SocialListeningSubscriptionStatusSchema: z.ZodEnum<{
    ACTIVE: "ACTIVE";
    CANCELLED: "CANCELLED";
    PENDING_PAYMENT: "PENDING_PAYMENT";
    PAST_DUE: "PAST_DUE";
    EXPIRED: "EXPIRED";
}>;
export type SocialListeningSubscriptionStatusWire = z.infer<typeof SocialListeningSubscriptionStatusSchema>;
export declare const ListeningPlatformSchema: z.ZodEnum<{
    x: "x";
    tiktok: "tiktok";
    reddit: "reddit";
    instagram: "instagram";
    facebook: "facebook";
    web: "web";
    forums: "forums";
}>;
export declare const ListeningKeywordMatchTypeSchema: z.ZodEnum<{
    broad: "broad";
    exact: "exact";
}>;
