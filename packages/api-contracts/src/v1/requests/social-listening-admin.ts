import { z } from 'zod'
import {
  SocialListeningBillingSourceSchema,
  SocialListeningPlanSchema,
  SocialListeningSubscriptionStatusSchema,
} from '../../zod/enums'
import { CreateListeningSetupSchema } from './social-listening'

export const GrantSubscriptionSchema = z.object({
  organizationId: z.string(),
  plan: SocialListeningPlanSchema,
  billingSource: SocialListeningBillingSourceSchema,
  periodMonths: z.number().int().min(1).optional(),
  autoRenewEnabled: z.boolean().optional(),
})
export type GrantSubscriptionInput = z.infer<typeof GrantSubscriptionSchema>

export const PatchSubscriptionSchema = z.object({
  plan: SocialListeningPlanSchema.optional(),
  extendMonths: z.number().int().min(1).optional(),
  autoRenewEnabled: z.boolean().optional(),
})
export type PatchSubscriptionInput = z.infer<typeof PatchSubscriptionSchema>

export const CancelSubscriptionSchema = z.object({
  immediate: z.boolean(),
  cancelReason: z.string().max(2000).optional(),
})
export type CancelSubscriptionInput = z.infer<typeof CancelSubscriptionSchema>

export const ListSubscriptionsQuerySchema = z.object({
  status: SocialListeningSubscriptionStatusSchema.optional(),
  plan: SocialListeningPlanSchema.optional(),
  expiringSoon: z.coerce.boolean().optional(),
  noSetup: z.coerce.boolean().optional(),
})
export type ListSubscriptionsQueryInput = z.infer<typeof ListSubscriptionsQuerySchema>

export const AdminCreateSetupSchema = CreateListeningSetupSchema.extend({
  organizationId: z.string(),
})
export type AdminCreateSetupInput = z.infer<typeof AdminCreateSetupSchema>
