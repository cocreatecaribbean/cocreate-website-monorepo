export type SocialListeningPlanId = 'pulse' | 'growth' | 'scale'

export type SocialListeningPlanDefinition = {
  id: SocialListeningPlanId
  prismaPlan: 'PULSE' | 'GROWTH' | 'SCALE'
  name: string
  priceLabel: string
  periodLabel: string
  amountCents: number
  currency: string
  description: string
  mentions: string
  alerts: string
  keywords: string
  users: string
  highlighted: boolean
  features: readonly string[]
}

export const SOCIAL_LISTENING_PLANS: readonly SocialListeningPlanDefinition[] = [
  {
    id: 'pulse',
    prismaPlan: 'PULSE',
    name: 'Pulse',
    priceLabel: '$149',
    periodLabel: '/ month',
    amountCents: 14900,
    currency: 'USD',
    description: 'Essential monitoring for a focused brand footprint.',
    mentions: '5,000',
    alerts: '5',
    keywords: '10',
    users: '2',
    highlighted: false,
    features: [
      'Monthly mention volume cap',
      'Email alert digests',
      'Web + social sources',
      'Basic sentiment tags',
    ],
  },
  {
    id: 'growth',
    prismaPlan: 'GROWTH',
    name: 'Growth',
    priceLabel: '$349',
    periodLabel: '/ month',
    amountCents: 34900,
    currency: 'USD',
    description: 'Most popular — scale mentions and real-time alerts.',
    mentions: '25,000',
    alerts: '25',
    keywords: '50',
    users: '5',
    highlighted: true,
    features: [
      'Everything in Pulse',
      'Real-time mention alerts',
      'Competitor keyword sets',
      'Sentiment & share-of-voice',
      'Exportable PDF reports',
    ],
  },
  {
    id: 'scale',
    prismaPlan: 'SCALE',
    name: 'Scale',
    priceLabel: '$799',
    periodLabel: '/ month',
    amountCents: 79900,
    currency: 'USD',
    description: 'High-volume listening for regional or multi-brand teams.',
    mentions: '100,000',
    alerts: 'Unlimited',
    keywords: '200',
    users: '15',
    highlighted: false,
    features: [
      'Everything in Growth',
      'Priority mention indexing',
      'Custom alert rules & webhooks',
      'Dedicated account support',
      'API access (coming soon)',
    ],
  },
] as const

export function planIncludesPdfExports(plan: 'PULSE' | 'GROWTH' | 'SCALE'): boolean {
  return plan !== 'PULSE'
}

export function getPlanById(id: string): SocialListeningPlanDefinition | undefined {
  return SOCIAL_LISTENING_PLANS.find((p) => p.id === id)
}

export function getPlanByPrismaPlan(
  plan: 'PULSE' | 'GROWTH' | 'SCALE',
): SocialListeningPlanDefinition | undefined {
  return SOCIAL_LISTENING_PLANS.find((p) => p.prismaPlan === plan)
}

export function planIdToPrismaPlan(id: SocialListeningPlanId): 'PULSE' | 'GROWTH' | 'SCALE' {
  const plan = getPlanById(id)
  if (!plan) throw new Error(`Unknown plan id: ${id}`)
  return plan.prismaPlan
}

export function formatPlanAmount(plan: SocialListeningPlanDefinition): string {
  return (plan.amountCents / 100).toFixed(2)
}

export function buildFygaroCustomReference(
  subscriptionId: string,
  eventType: 'initial' | 'renewal' | 'manual_renewal' | 'update_payment',
): string {
  return `sl:${subscriptionId}:${eventType}`
}

export function parseFygaroCustomReference(
  customReference: string | null | undefined,
): { subscriptionId: string; eventType: string } | null {
  if (!customReference?.startsWith('sl:')) return null
  const parts = customReference.split(':')
  if (parts.length !== 3) return null
  const subscriptionId = parts[1]
  const eventType = parts[2]
  if (!subscriptionId || !eventType) return null
  return { subscriptionId, eventType }
}
