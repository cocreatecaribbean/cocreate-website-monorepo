import { z } from 'zod';
export declare const SubscribeBillingSchema: z.ZodObject<{
    plan: z.ZodEnum<{
        pulse: "pulse";
        growth: "growth";
        scale: "scale";
    }>;
}, z.core.$strip>;
export type SubscribeBillingInput = z.infer<typeof SubscribeBillingSchema>;
export declare const ToggleAutoRenewSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
}, z.core.$strip>;
export type ToggleAutoRenewInput = z.infer<typeof ToggleAutoRenewSchema>;
export declare const CancelSubscriptionClientSchema: z.ZodObject<{
    cancelReason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CancelSubscriptionClientInput = z.infer<typeof CancelSubscriptionClientSchema>;
