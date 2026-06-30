import { z } from 'zod'
import { isoDateString } from '../../zod/common'
import {
  ListeningKeywordMatchTypeSchema,
  ListeningPlatformSchema,
} from '../../zod/enums'

export const ListeningSetupKeywordSchema = z.object({
  value: z.string().min(3).max(50),
  matchType: ListeningKeywordMatchTypeSchema,
})
export type ListeningSetupKeywordInput = z.infer<typeof ListeningSetupKeywordSchema>

export const CreateListeningSetupSchema = z.object({
  keywords: z.array(ListeningSetupKeywordSchema).min(1).max(5),
  platforms: z.array(ListeningPlatformSchema).min(1).max(7),
  startDate: isoDateString,
  endDate: isoDateString,
})
export type CreateListeningSetupInput = z.infer<typeof CreateListeningSetupSchema>

/** Alias for social-listening data-source interface. */
export type CreateListeningSetupPayload = CreateListeningSetupInput
