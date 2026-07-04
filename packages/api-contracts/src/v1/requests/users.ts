import { z } from 'zod'
import { emailString } from '../../zod/common'
import { AdminAssignableRoleSchema } from '../../zod/enums'
import { ThemePreferenceSchema } from '../schemas/shared/preferences'

export const UpdateUserPreferencesSchema = z
  .object({
    theme: ThemePreferenceSchema.optional(),
    extras: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .refine((value) => value.theme !== undefined || value.extras !== undefined, {
    message: 'At least one preference field is required',
  })
export type UpdateUserPreferencesInput = z.infer<typeof UpdateUserPreferencesSchema>

export const UpdateAdminProfileSchema = z.object({
  displayName: z.string().max(120).optional(),
  jobTitleOptionIds: z.array(z.string()).optional(),
})
export type UpdateAdminProfileInput = z.infer<typeof UpdateAdminProfileSchema>

export const AvatarUploadUrlSchema = z.object({
  fileName: z.string().max(255),
  mimeType: z.string().max(120),
  sizeBytes: z.number().int().min(1).max(5 * 1024 * 1024),
})
export type AvatarUploadUrlInput = z.infer<typeof AvatarUploadUrlSchema>

export const RegisterAvatarSchema = z.object({
  storagePath: z.string().max(500),
})
export type RegisterAvatarInput = z.infer<typeof RegisterAvatarSchema>

export const CreateProfileOptionSchema = z.object({
  label: z.string().max(120),
  sortOrder: z.number().int().min(0).optional(),
})
export type CreateProfileOptionInput = z.infer<typeof CreateProfileOptionSchema>

export const UpdateProfileOptionSchema = z.object({
  label: z.string().max(120).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})
export type UpdateProfileOptionInput = z.infer<typeof UpdateProfileOptionSchema>

export const UpdateAdminRoleSchema = z.object({
  role: AdminAssignableRoleSchema,
})
export type UpdateAdminRoleInput = z.infer<typeof UpdateAdminRoleSchema>

export const InviteAdminSchema = z.object({
  email: emailString,
})
export type InviteAdminInput = z.infer<typeof InviteAdminSchema>
