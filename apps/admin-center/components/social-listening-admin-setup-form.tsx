'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminToast from '@/components/admin-toast'
import { useCreateSocialListeningSetupMutation } from '@/lib/api/mutations/social-listening'
import { useSocialListeningClientRowsQuery } from '@/lib/api/queries/social-listening'

const PLATFORMS = ['web', 'x', 'instagram', 'facebook', 'tiktok', 'reddit', 'forums'] as const

function formatDateInput(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function SocialListeningAdminSetupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetOrgId = searchParams.get('organizationId') ?? ''
  const { data: clients = [] } = useSocialListeningClientRowsQuery()
  const createSetupMutation = useCreateSocialListeningSetupMutation()

  const defaults = useMemo(() => {
    const end = new Date()
    const start = new Date(end)
    start.setUTCDate(start.getUTCDate() - 6)
    return { start: formatDateInput(start), end: formatDateInput(end) }
  }, [])

  const [organizationId, setOrganizationId] = useState(presetOrgId)
  const [keyword, setKeyword] = useState('')
  const [platforms, setPlatforms] = useState<string[]>(['web', 'x', 'instagram'])
  const [startDate, setStartDate] = useState(defaults.start)
  const [endDate, setEndDate] = useState(defaults.end)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (presetOrgId) setOrganizationId(presetOrgId)
  }, [presetOrgId])

  const togglePlatform = (id: string) => {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!organizationId || !keyword.trim()) return
    setError(null)
    try {
      await createSetupMutation.mutateAsync({
        organizationId,
        keywords: [{ value: keyword.trim(), matchType: 'broad' as const }],
        platforms,
        startDate,
        endDate,
      })
      router.push(`/social-listening/subscriptions/${organizationId}/analytics`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed.')
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="admin-surface max-w-2xl space-y-4 rounded-2xl p-6">
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
        <label className="text-sm font-medium text-chambray">Primary keyword</label>
        <input
          className="admin-input mt-1 w-full"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Brand or campaign name"
          required
        />
      </div>
      <div>
        <p className="text-sm font-medium text-chambray">Platforms</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <label key={p} className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
              <input
                type="checkbox"
                checked={platforms.includes(p)}
                onChange={() => togglePlatform(p)}
              />
              {p}
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-chambray">Start date</label>
          <input
            type="date"
            className="admin-input mt-1 w-full"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-chambray">End date</label>
          <input
            type="date"
            className="admin-input mt-1 w-full"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={createSetupMutation.isPending} className="admin-btn-primary min-h-10">
          {createSetupMutation.isPending ? 'Creating…' : 'Create listening setup'}
        </button>
        <Link href="/social-listening" className="admin-btn-ghost inline-flex min-h-10 items-center">
          Cancel
        </Link>
      </div>
    </form>
  )
}
