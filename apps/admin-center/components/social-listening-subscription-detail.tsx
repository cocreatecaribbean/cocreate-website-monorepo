'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import AdminToast from '@/components/admin-toast'
import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { bricolage_grot600 } from '@/styles/fonts'

type DetailResponse = {
  subscription: {
    id: string
    plan: string
    status: string
    startedAt: string | null
    currentPeriodEnd: string | null
    autoRenewEnabled: boolean
    cancelAtPeriodEnd: boolean
    billingSource: string
    paymentMethodLast4: string | null
    paymentMethodBrand: string | null
    paymentEvents: Array<{
      id: string
      eventType: string
      amount: string
      currency: string
      processedAt: string
    }>
    billingEmailLogs: Array<{
      id: string
      emailType: string
      sentAt: string
      recipientEmail: string
    }>
    organization: { id: string; name: string; slug: string }
  } | null
  setups: Array<{
    id: string
    status: string
    startDate: string
    endDate: string
    brand24ProjectId: string | null
    createdBy: string
    createdAt: string
  }>
}

export default function SocialListeningSubscriptionDetail({
  organizationId,
}: {
  organizationId: string
}) {
  const [data, setData] = useState<DetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchAdminBff<DetailResponse>(
        `/api/social-listening/subscriptions/${organizationId}`,
      )
      setData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load subscription.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [organizationId])

  const cancel = async (immediate: boolean) => {
    setSubmitting(true)
    setError(null)
    try {
      await fetchAdminBff(
        `/api/social-listening/subscriptions/${organizationId}/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ immediate, cancelReason: 'Cancelled by admin' }),
        },
      )
      setSuccess(immediate ? 'Subscription cancelled.' : 'Subscription set to cancel at period end.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const extend = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetchAdminBff(`/api/social-listening/subscriptions/${organizationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extendMonths: 1 }),
      })
      setSuccess('Extended by 1 month.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extend failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="text-sm text-app-muted">Loading…</p>
  if (!data?.subscription) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-app-muted">No subscription for this client.</p>
        <Link href="/social-listening/subscriptions/new" className="admin-btn-primary inline-flex min-h-10">
          Grant subscription
        </Link>
      </div>
    )
  }

  const sub = data.subscription

  return (
    <div className="space-y-8">
      {error ? (
        <AdminToast message={error} variant="error" onDismiss={() => setError(null)} />
      ) : null}
      {success ? (
        <AdminToast message={success} variant="success" onDismiss={() => setSuccess(null)} />
      ) : null}

      <div className="admin-surface rounded-2xl p-6">
        <h2 className={`text-lg text-chambray ${bricolage_grot600.className}`}>
          {sub.organization.name}
        </h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <dt className="text-app-muted">Plan</dt>
            <dd className="font-medium capitalize">{sub.plan.toLowerCase()}</dd>
          </div>
          <div>
            <dt className="text-app-muted">Status</dt>
            <dd className="font-medium">{sub.status.replace(/_/g, ' ')}</dd>
          </div>
          <div>
            <dt className="text-app-muted">Billing source</dt>
            <dd className="font-medium">{sub.billingSource.replace(/_/g, ' ')}</dd>
          </div>
          <div>
            <dt className="text-app-muted">Started</dt>
            <dd>{sub.startedAt ? new Date(sub.startedAt).toLocaleDateString() : '—'}</dd>
          </div>
          <div>
            <dt className="text-app-muted">Renews / ends</dt>
            <dd>
              {sub.currentPeriodEnd
                ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-app-muted">Auto-renew</dt>
            <dd>{sub.autoRenewEnabled ? 'On' : 'Off'}</dd>
          </div>
          {sub.paymentMethodLast4 ? (
            <div>
              <dt className="text-app-muted">Payment method</dt>
              <dd>
                {sub.paymentMethodBrand ?? 'Card'} ···· {sub.paymentMethodLast4}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/social-listening/subscriptions/${organizationId}/analytics`}
            className="admin-btn-primary inline-flex min-h-10 items-center px-4"
          >
            View analytics
          </Link>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void cancel(false)}
            className="admin-btn-ghost min-h-10"
          >
            Cancel at period end
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void cancel(true)}
            className="admin-btn-ghost min-h-10"
          >
            Cancel now
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={(e) => void extend(e)}
            className="admin-btn-primary min-h-10"
          >
            Extend 1 month
          </button>
          <Link
            href={`/social-listening/setups/new?organizationId=${organizationId}`}
            className="admin-btn-ghost inline-flex min-h-10 items-center"
          >
            Create setup
          </Link>
        </div>
      </div>

      <section className="admin-surface rounded-2xl p-6">
        <h3 className={`text-base text-chambray ${bricolage_grot600.className}`}>Setup history</h3>
        {data.setups.length === 0 ? (
          <p className="mt-3 text-sm text-app-muted">No setups yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.setups.map((setup) => (
              <li key={setup.id} className="rounded-xl border border-chambray/10 p-4 text-sm">
                <span className="font-medium">{setup.status}</span>
                {' · '}
                {setup.startDate.slice(0, 10)} – {setup.endDate.slice(0, 10)}
                {' · '}
                by {setup.createdBy.toLowerCase()}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-surface rounded-2xl p-6">
        <h3 className={`text-base text-chambray ${bricolage_grot600.className}`}>Payment events</h3>
        <ul className="mt-4 space-y-2 text-sm text-app-muted">
          {sub.paymentEvents.map((ev) => (
            <li key={ev.id}>
              {ev.eventType} · {ev.amount} {ev.currency} ·{' '}
              {new Date(ev.processedAt).toLocaleString()}
            </li>
          ))}
          {sub.paymentEvents.length === 0 ? <li>None yet.</li> : null}
        </ul>
      </section>

      <section className="admin-surface rounded-2xl p-6">
        <h3 className={`text-base text-chambray ${bricolage_grot600.className}`}>
          Billing emails (billingupdates@mail.cocreatecaribbean.com)
        </h3>
        <ul className="mt-4 space-y-2 text-sm text-app-muted">
          {sub.billingEmailLogs.map((log) => (
            <li key={log.id}>
              {log.emailType.replace(/_/g, ' ')} → {log.recipientEmail} ·{' '}
              {new Date(log.sentAt).toLocaleString()}
            </li>
          ))}
          {sub.billingEmailLogs.length === 0 ? <li>None sent yet.</li> : null}
        </ul>
      </section>
    </div>
  )
}
