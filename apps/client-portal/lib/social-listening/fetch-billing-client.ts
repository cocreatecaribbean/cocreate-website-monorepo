'use client'
import { nestApiUrl } from '@cocreate/api-client'
import {
  ClientSubscriptionResponseSchema,
  type ClientSubscriptionView,
} from '@cocreate/api-contracts/v1/client-portal'

import { parseApiResponseSafe } from '@/lib/api/parse-response'
import { createSupabaseBrowserClient } from '@client-portal/lib/supabase/client'
import type { SocialListeningPlanId } from '@cocreate/social-listening-plans'

export type { ClientSubscriptionView }

async function getToken(): Promise<string | null> {
  const supabase = createSupabaseBrowserClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export async function fetchClientSubscription(): Promise<ClientSubscriptionView | null> {
  const token = await getToken()
  if (!token) return null
  const res = await fetch(nestApiUrl('/client-portal/social-listening/subscription'), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = await res.json().catch(() => null)
  const parsed = parseApiResponseSafe(ClientSubscriptionResponseSchema, data)
  return parsed?.subscription ?? null
}

export async function subscribeToPlan(plan: SocialListeningPlanId): Promise<{
  ok: boolean
  checkoutUrl?: string
  message?: string
}> {
  const token = await getToken()
  if (!token) return { ok: false, message: 'Not signed in' }
  const res = await fetch(nestApiUrl('/client-portal/social-listening/subscribe'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plan }),
  })
  return (await res.json()) as { ok: boolean; checkoutUrl?: string; message?: string }
}

export async function toggleAutoRenew(enabled: boolean): Promise<boolean> {
  const token = await getToken()
  if (!token) return false
  const res = await fetch(nestApiUrl('/client-portal/social-listening/subscription/auto-renew'), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ enabled }),
  })
  return res.ok
}

export async function cancelSubscription(cancelReason?: string): Promise<boolean> {
  const token = await getToken()
  if (!token) return false
  const res = await fetch(nestApiUrl('/client-portal/social-listening/subscription/cancel'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cancelReason }),
  })
  return res.ok
}

export async function getRenewCheckoutUrl(): Promise<string | null> {
  const token = await getToken()
  if (!token) return null
  const res = await fetch(nestApiUrl('/client-portal/social-listening/subscription/renew'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const data = (await res.json()) as { checkoutUrl?: string }
  return data.checkoutUrl ?? null
}

export async function getUpdatePaymentUrl(): Promise<string | null> {
  const token = await getToken()
  if (!token) return null
  const res = await fetch(
    nestApiUrl('/client-portal/social-listening/subscription/update-payment'),
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
  )
  if (!res.ok) return null
  const data = (await res.json()) as { checkoutUrl?: string }
  return data.checkoutUrl ?? null
}
