import { z } from 'zod';
export declare const UpdateAdminProfileSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    jobTitleOptionIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type UpdateAdminProfileInput = z.infer<typeof UpdateAdminProfileSchema>;
export declare const AvatarUploadUrlSchema: z.ZodObject<{
    fileName: z.ZodString;
    mimeType: z.ZodString;
    sizeBytes: z.ZodNumber;
}, z.core.$strip>;
export type AvatarUploadUrlInput = z.infer<typeof AvatarUploadUrlSchema>;
export declare const RegisterAvatarSchema: z.ZodObject<{
    storagePath: z.ZodString;
}, z.core.$strip>;
export type RegisterAvatarInput = z.infer<typeof RegisterAvatarSchema>;
export declare const CreateProfileOptionSchema: z.ZodObject<{
    label: z.ZodString;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type CreateProfileOptionInput = z.infer<typeof CreateProfileOptionSchema>;
export declare const UpdateProfileOptionSchema: z.ZodObject<{
    label: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type UpdateProfileOptionInput = z.infer<typeof UpdateProfileOptionSchema>;
export declare const UpdateAdminRoleSchema: z.ZodObject<{
    role: z.ZodEnum<{
        SUPER_ADMIN: "SUPER_ADMIN";
        ADMIN: "ADMIN";
    }>;
}, z.core.$strip>;
export type UpdateAdminRoleInput = z.infer<typeof UpdateAdminRoleSchema>;
export declare const InviteAdminSchema: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export type InviteAdminInput = z.infer<typeof InviteAdminSchema>;
