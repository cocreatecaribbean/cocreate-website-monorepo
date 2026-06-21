'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminToast from '@/components/admin-toast'
import { fetchAdminBff } from '@/lib/admin-api-fetch'

type ClientRow = { id: string; name: string }

export default function GrantSubscriptionForm() {
  const router = useRouter()
  const [clients, setClients] = useState<ClientRow[]>([])
  const [organizationId, setOrganizationId] = useState('')
  const [plan, setPlan] = useState<'PULSE' | 'GROWTH' | 'SCALE'>('GROWTH')
  const [billingSource, setBillingSource] = useState<'ADMIN_COMP' | 'ADMIN_MANUAL'>('ADMIN_COMP')
  const [periodMonths, setPeriodMonths] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void fetchAdminBff<ClientRow[]>('/api/clients').then(setClients).catch(() => {})
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!organizationId) return
    setSubmitting(true)
    setError(null)
    try {
      await fetchAdminBff('/api/social-listening/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          plan,
          billingSource,
          periodMonths,
          autoRenewEnabled: false,
        }),
      })
      router.push(`/social-listening/subscriptions/${organizationId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not grant subscription.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="admin-surface max-w-xl space-y-4 rounded-2xl p-6">
      {error ? (
        <AdminToast message={error} variant="error" onDismiss={() => setError(null)} />
      ) : null}
      <div>
        <label className="text-sm font-medium text-chambray">Client</label>
        <select
          className="admin-input mt-1 w-full"
          value={organizationId}
          onChange={(e) => setOrganizationId(e.target.value)}
          required
        >
          <option value="">Select organization…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-chambray">Plan</label>
        <select
          className="admin-input mt-1 w-full"
          value={plan}
          onChange={(e) => setPlan(e.target.value as typeof plan)}
        >
          <option value="PULSE">Pulse</option>
          <option value="GROWTH">Growth</option>
          <option value="SCALE">Scale</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-chambray">Billing source</label>
        <select
          className="admin-input mt-1 w-full"
          value={billingSource}
          onChange={(e) => setBillingSource(e.target.value as typeof billingSource)}
        >
          <option value="ADMIN_COMP">Complimentary</option>
          <option value="ADMIN_MANUAL">Manual / offline payment</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-chambray">Period (months)</label>
        <input
          type="number"
          min={1}
          className="admin-input mt-1 w-full"
          value={periodMonths}
          onChange={(e) => setPeriodMonths(Number(e.target.value))}
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={submitting} className="admin-btn-primary min-h-10">
          {submitting ? 'Saving…' : 'Grant subscription'}
        </button>
        <Link href="/social-listening" className="admin-btn-ghost inline-flex min-h-10 items-center">
          Cancel
        </Link>
      </div>
    </form>
  )
}
