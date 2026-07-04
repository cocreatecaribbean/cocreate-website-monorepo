import { z } from 'zod'

export const ThemePreferenceSchema = z.enum(['light', 'dark', 'system'])
export type ThemePreference = z.infer<typeof ThemePreferenceSchema>

export const UserPreferencesSchema = z.object({
  theme: ThemePreferenceSchema,
})
export type UserPreferences = z.infer<typeof UserPreferencesSchema>

export const UserPreferencesResponseSchema = UserPreferencesSchema.extend({
  ok: z.literal(true),
})
export type UserPreferencesResponse = z.infer<typeof UserPreferencesResponseSchema>
