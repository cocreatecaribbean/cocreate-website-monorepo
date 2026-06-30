import { z } from 'zod';
export declare const GrantSubscriptionSchema: z.ZodObject<{
    organizationId: z.ZodString;
    plan: z.ZodEnum<{
        PULSE: "PULSE";
        GROWTH: "GROWTH";
        SCALE: "SCALE";
    }>;
    billingSource: z.ZodEnum<{
        FYGARO: "FYGARO";
        ADMIN_COMP: "ADMIN_COMP";
        ADMIN_MANUAL: "ADMIN_MANUAL";
    }>;
    periodMonths: z.ZodOptional<z.ZodNumber>;
    autoRenewEnabled: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type GrantSubscriptionInput = z.infer<typeof GrantSubscriptionSchema>;
export declare const PatchSubscriptionSchema: z.ZodObject<{
    plan: z.ZodOptional<z.ZodEnum<{
        PULSE: "PULSE";
        GROWTH: "GROWTH";
        SCALE: "SCALE";
    }>>;
    extendMonths: z.ZodOptional<z.ZodNumber>;
    autoRenewEnabled: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type PatchSubscriptionInput = z.infer<typeof PatchSubscriptionSchema>;
export declare const CancelSubscriptionSchema: z.ZodObject<{
    immediate: z.ZodBoolean;
    cancelReason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CancelSubscriptionInput = z.infer<typeof CancelSubscriptionSchema>;
export declare const ListSubscriptionsQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        CANCELLED: "CANCELLED";
        PENDING_PAYMENT: "PENDING_PAYMENT";
        PAST_DUE: "PAST_DUE";
        EXPIRED: "EXPIRED";
    }>>;
    plan: z.ZodOptional<z.ZodEnum<{
        PULSE: "PULSE";
        GROWTH: "GROWTH";
        SCALE: "SCALE";
    }>>;
    expiringSoon: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    noSetup: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
}, z.core.$strip>;
export type ListSubscriptionsQueryInput = z.infer<typeof ListSubscriptionsQuerySchema>;
export declare const AdminCreateSetupSchema: z.ZodObject<{
    keywords: z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        matchType: z.ZodEnum<{
            broad: "broad";
            exact: "exact";
        }>;
    }, z.core.$strip>>;
    platforms: z.ZodArray<z.ZodEnum<{
        x: "x";
        tiktok: "tiktok";
        reddit: "reddit";
        instagram: "instagram";
        facebook: "facebook";
        web: "web";
        forums: "forums";
    }>>;
    startDate: z.ZodString;
    endDate: z.ZodString;
    organizationId: z.ZodString;
}, z.core.$strip>;
export type AdminCreateSetupInput = z.infer<typeof AdminCreateSetupSchema>;
