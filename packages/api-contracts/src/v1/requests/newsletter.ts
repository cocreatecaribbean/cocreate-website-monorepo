import { z } from 'zod'
import { emailString } from '../../zod/common'

export const SubscribeNewsletterSchema = z.object({
  email: emailString,
  website: z.string().optional(),
})
export type SubscribeNewsletterInput = z.infer<typeof SubscribeNewsletterSchema>
