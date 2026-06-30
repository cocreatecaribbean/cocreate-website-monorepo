import { z } from 'zod';
export declare const ListeningSetupKeywordSchema: z.ZodObject<{
    value: z.ZodString;
    matchType: z.ZodEnum<{
        broad: "broad";
        exact: "exact";
    }>;
}, z.core.$strip>;
export type ListeningSetupKeywordInput = z.infer<typeof ListeningSetupKeywordSchema>;
export declare const CreateListeningSetupSchema: z.ZodObject<{
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
}, z.core.$strip>;
export type CreateListeningSetupInput = z.infer<typeof CreateListeningSetupSchema>;
export type CreateListeningSetupPayload = CreateListeningSetupInput;
