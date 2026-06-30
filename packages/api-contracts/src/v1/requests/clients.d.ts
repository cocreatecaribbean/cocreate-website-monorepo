import { z } from 'zod';
export declare const InviteClientSchema: z.ZodObject<{
    companyName: z.ZodString;
    clientEmail: z.ZodString;
    enableSocialListening: z.ZodOptional<z.ZodBoolean>;
    logoUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type InviteClientInput = z.infer<typeof InviteClientSchema>;
export declare const LogoUploadUrlSchema: z.ZodObject<{
    fileName: z.ZodString;
    mimeType: z.ZodString;
    sizeBytes: z.ZodNumber;
}, z.core.$strip>;
export type LogoUploadUrlInput = z.infer<typeof LogoUploadUrlSchema>;
export declare const UpdateSocialListeningSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
}, z.core.$strip>;
export type UpdateSocialListeningInput = z.infer<typeof UpdateSocialListeningSchema>;
export declare const UpdateBrand24ProjectSchema: z.ZodObject<{
    brand24ProjectId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type UpdateBrand24ProjectInput = z.infer<typeof UpdateBrand24ProjectSchema>;
