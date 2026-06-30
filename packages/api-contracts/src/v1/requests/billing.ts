import { z } from 'zod'
import { SocialListeningPlanIdSchema } from '../../zod/enums'

export const SubscribeBillingSchema = z.object({
  plan: SocialListeningPlanIdSchema,
})
export type SubscribeBillingInput = z.infer<typeof SubscribeBillingSchema>

export const ToggleAutoRenewSchema = z.object({
  enabled: z.boolean(),
})
export type ToggleAutoRenewInput = z.infer<typeof ToggleAutoRenewSchema>

export const CancelSubscriptionClientSchema = z.object({
  cancelReason: z.string().max(2000).optional(),
})
export type CancelSubscriptionClientInput = z.infer<
  typeof CancelSubscriptionClientSchema
>
