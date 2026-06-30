import { z } from 'zod'
import { emailString } from '../../zod/common'

export const InviteClientSchema = z.object({
  companyName: z.string().min(1),
  clientEmail: emailString,
  enableSocialListening: z.boolean().optional(),
  logoUrl: z.string().url({ message: 'Invalid URL' }).optional(),
})
export type InviteClientInput = z.infer<typeof InviteClientSchema>

export const LogoUploadUrlSchema = z.object({
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().min(1),
})
export type LogoUploadUrlInput = z.infer<typeof LogoUploadUrlSchema>

export const UpdateSocialListeningSchema = z.object({
  enabled: z.boolean(),
})
export type UpdateSocialListeningInput = z.infer<typeof UpdateSocialListeningSchema>

export const UpdateBrand24ProjectSchema = z.object({
  brand24ProjectId: z.string().max(128).nullable().optional(),
})
export type UpdateBrand24ProjectInput = z.infer<typeof UpdateBrand24ProjectSchema>
