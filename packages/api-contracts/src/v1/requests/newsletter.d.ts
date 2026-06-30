import { z } from 'zod';
export declare const SubscribeNewsletterSchema: z.ZodObject<{
    email: z.ZodString;
    website: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SubscribeNewsletterInput = z.infer<typeof SubscribeNewsletterSchema>;
