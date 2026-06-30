'use client'

import Link from 'next/link'
import { useState } from 'react'
import AdminToast from '@/components/admin-toast'
import { useSocialListeningStatsQuery, useSocialListeningSubscriptionsQuery } from '@/lib/api/queries/social-listening'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'

const statusClass: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-900',
  PENDING_PAYMENT: 'bg-amber-100 text-amber-900',
  PAST_DUE: 'bg-red-100 text-red-900',
  CANCELLED: 'bg-slate-100 text-slate-700',
  EXPIRED: 'bg-slate-100 text-slate-600',
}

export default function SocialListeningCenter() {
  const statsQuery = useSocialListeningStatsQuery()
  const subscriptionsQuery = useSocialListeningSubscriptionsQuery()
  const [dismissedError, setDismissedError] = useState(false)

  const stats = statsQuery.data ?? null
  const subscriptions = subscriptionsQuery.data ?? []
  const loading = statsQuery.isLoading || subscriptionsQuery.isLoading
  const queryError = statsQuery.error ?? subscriptionsQuery.error
  const error =
    !dismissedError && queryError
      ? queryError instanceof Error
        ? queryError.message
        : 'Could not load Social Listening data.'
      : null

  return (
    <div className="space-y-8">
      {error ? (
        <AdminToast message={error} variant="error" onDismiss={() => setDismissedError(true)} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Active subscribers', value: stats?.active ?? '—' },
          { label: 'Pending payment', value: stats?.pending ?? '—' },
          { label: 'Expiring in 7 days', value: stats?.expiringSoon ?? '—' },
          { label: 'No active setup', value: stats?.noSetup ?? '—' },
        ].map((kpi) => (
          <div key={kpi.label} className="admin-surface rounded-2xl p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-app-muted">{kpi.label}</p>
            <p className={`mt-2 text-3xl text-chambray ${bricolage_grot700.className}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/social-listening/subscriptions/new" className="admin-btn-primary min-h-10">
          Grant subscription
        </Link>
        <Link href="/social-listening/setups/new" className="admin-btn-ghost min-h-10">
          Create listening setup
        </Link>
      </div>

      <section className="admin-surface overflow-hidden rounded-2xl">
        <div className="border-b border-chambray/10 px-5 py-4">
          <h2 className={`text-lg text-chambray ${bricolage_grot600.className}`}>Subscriptions</h2>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-app-muted">Loading…</p>
        ) : subscriptions.length === 0 ? (
          <p className="p-6 text-sm text-app-muted">No subscriptions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-chambray/[0.04] text-xs uppercase tracking-wide text-app-muted">
                <tr>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Renews / ends</th>
                  <th className="px-5 py-3">Billing</th>
                  <th className="px-5 py-3">Setup</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-t border-chambray/8">
                    <td className="px-5 py-4 font-medium text-chambray">
                      {sub.organization.name}
                    </td>
                    <td className="px-5 py-4 capitalize">{sub.plan.toLowerCase()}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[sub.status] ?? 'bg-slate-100'}`}
                      >
                        {sub.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-app-muted">
                      {sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-app-muted">
                      {sub.billingSource.replace(/_/g, ' ')}
                      {sub.autoRenewEnabled ? ' · Auto-renew' : ''}
                    </td>
                    <td className="px-5 py-4 text-app-muted">
                      {sub.organization.brand24ProjectId ? 'Configured' : 'Pending'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/social-listening/subscriptions/${sub.organizationId}/analytics`}
                          className="text-sanmarino underline underline-offset-2"
                        >
                          Analytics
                        </Link>
                        <Link
                          href={`/social-listening/subscriptions/${sub.organizationId}`}
                          className="text-sanmarino underline underline-offset-2"
                        >
                          Manage
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
