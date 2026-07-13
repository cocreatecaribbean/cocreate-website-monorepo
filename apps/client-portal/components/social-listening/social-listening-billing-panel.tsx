'use client'

import { useState } from 'react'
import {
  getRenewCheckoutUrl,
  getUpdatePaymentUrl,
} from '@client-portal/lib/social-listening/fetch-billing-client'
import {
  useCancelSubscriptionMutation,
  useToggleAutoRenewMutation,
} from '@/lib/api/mutations/social-listening'
import { useClientSubscriptionQuery } from '@/lib/api/queries/social-listening'
import { bricolage_grot600 } from '@client-portal/styles/fonts'

export default function SocialListeningBillingPanel({
  isOwner,
}: {
  isOwner: boolean
}) {
  const { data: subscription, isLoading: loading } = useClientSubscriptionQuery()
  const toggleAutoRenew = useToggleAutoRenewMutation()
  const cancelSubscription = useCancelSubscriptionMutation()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (loading) {
    return <p className="text-sm text-app-muted">Loading billing…</p>
  }

  if (!subscription) {
    return null
  }

  const daysUntilEnd = subscription.currentPeriodEnd
    ? Math.ceil(
        (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / 86400000,
      )
    : null

  const showExpiryBanner =
    daysUntilEnd !== null && daysUntilEnd <= 7 && !subscription.autoRenewEnabled

  return (
    <section className="portal-surface-solid mb-6 p-5 sm:p-6">
      <h3 className={`text-base text-chambray ${bricolage_grot600.className}`}>Billing</h3>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-app-muted">Plan</dt>
          <dd>{subscription.planName}</dd>
        </div>
        <div>
          <dt className="text-app-muted">Status</dt>
          <dd>{subscription.status.replace(/_/g, ' ')}</dd>
        </div>
        <div>
          <dt className="text-app-muted">{subscription.autoRenewEnabled ? 'Renews' : 'Ends'}</dt>
          <dd>
            {subscription.currentPeriodEnd
              ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
              : '—'}
          </dd>
        </div>
        {subscription.paymentMethod ? (
          <div>
            <dt className="text-app-muted">Payment method</dt>
            <dd>
              {subscription.paymentMethod.brand ?? 'Card'} ···· {subscription.paymentMethod.last4}
            </dd>
          </div>
        ) : null}
      </dl>

      {showExpiryBanner ? (
        <p className="portal-alert-warn mt-4">
          Your subscription ends in {daysUntilEnd} day{daysUntilEnd === 1 ? '' : 's'}. Renew or
          turn on auto-renew to avoid interruption.
        </p>
      ) : null}

      {message ? <p className="mt-3 text-sm text-app-muted">{message}</p> : null}

      {isOwner ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={subscription.autoRenewEnabled}
              disabled={busy || subscription.billingSource !== 'FYGARO' || toggleAutoRenew.isPending}
              onChange={async (e) => {
                setBusy(true)
                const ok = await toggleAutoRenew.mutateAsync(e.target.checked)
                setMessage(ok ? 'Auto-renew updated.' : 'Could not update auto-renew.')
                setBusy(false)
              }}
            />
            Auto-renew monthly
          </label>
          {!subscription.autoRenewEnabled ? (
            <button
              type="button"
              disabled={busy}
              className="portal-btn-primary"
              onClick={async () => {
                setBusy(true)
                const url = await getRenewCheckoutUrl()
                if (url) window.location.href = url
                else setMessage('Renewal checkout unavailable.')
                setBusy(false)
              }}
            >
              Renew now
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            className="portal-btn-ghost"
            onClick={async () => {
              setBusy(true)
              const url = await getUpdatePaymentUrl()
              if (url) window.location.href = url
              setBusy(false)
            }}
          >
            Update payment method
          </button>
          {!subscription.cancelAtPeriodEnd ? (
            <button
              type="button"
              disabled={busy || cancelSubscription.isPending}
              className="portal-btn-ghost"
              onClick={async () => {
                setBusy(true)
                const ok = await cancelSubscription.mutateAsync()
                setMessage(
                  ok ? 'Subscription will cancel at end of billing period.' : 'Cancel failed.',
                )
                setBusy(false)
              }}
            >
              Cancel at period end
            </button>
          ) : (
            <p className="text-sm text-app-muted">Cancellation scheduled at period end.</p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-app-muted">
          Billing is managed by your organization owner.
        </p>
      )}
    </section>
  )
}
