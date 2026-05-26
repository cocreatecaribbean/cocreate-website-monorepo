'use client'

import { FormEvent, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createListeningSetup } from '@/lib/social-listening/fetch-analytics-client'
import {
  PLATFORM_META,
  type SocialPlatformId,
} from '@/lib/social-listening/platform-meta'
import { PORTAL_SETTINGS_QUERY } from '@/lib/portal/nav'
import { SOCIAL_LISTENING_VIEW_QUERY } from '@/lib/social-listening/nav'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'

type KeywordRow = { value: string; matchType: 'broad' | 'exact' }

const ALL_PLATFORMS = Object.keys(PLATFORM_META) as SocialPlatformId[]

function formatDateInput(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function defaultDateRange() {
  const end = new Date()
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 6)
  return { start: formatDateInput(start), end: formatDateInput(end) }
}

type SocialListeningSetupPanelProps = {
  onComplete?: () => void
}

export default function SocialListeningSetupPanel({
  onComplete,
}: SocialListeningSetupPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const defaults = useMemo(() => defaultDateRange(), [])

  const [keywords, setKeywords] = useState<KeywordRow[]>([
    { value: '', matchType: 'broad' },
  ])
  const [platforms, setPlatforms] = useState<SocialPlatformId[]>([
    'web',
    'x',
    'instagram',
  ])
  const [startDate, setStartDate] = useState(defaults.start)
  const [endDate, setEndDate] = useState(defaults.end)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const minDate = useMemo(() => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - 92)
    return formatDateInput(d)
  }, [])
  const maxDate = useMemo(() => formatDateInput(new Date()), [])

  const togglePlatform = (id: SocialPlatformId) => {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
  }

  const goToSummary = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(PORTAL_SETTINGS_QUERY)
    params.delete(SOCIAL_LISTENING_VIEW_QUERY)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const trimmed = keywords
      .map((k) => ({ value: k.value.trim(), matchType: k.matchType }))
      .filter((k) => k.value.length >= 3)

    if (!trimmed.length) {
      setError('Add at least one keyword (3–50 characters).')
      return
    }
    if (trimmed.length > 5) {
      setError('You can track up to 5 keywords.')
      return
    }
    if (!platforms.length) {
      setError('Select at least one platform.')
      return
    }

    setSubmitting(true)
    const result = await createListeningSetup({
      keywords: trimmed,
      platforms,
      startDate,
      endDate,
    })
    setSubmitting(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setSuccess(
      `Listening setup saved. Captured ${result.snapshotsCaptured} snapshot(s) from ${result.startDate} to ${result.endDate}. Data will appear in View date as processing completes.`,
    )
    onComplete?.()
    setTimeout(() => goToSummary(), 1500)
  }

  return (
    <div className="space-y-6">
      <section className="portal-glass-card p-6 sm:p-8">
        <p className="portal-eyebrow">Listening setup</p>
        <h3 className={`mt-2 text-xl text-chambray ${bricolage_grot700.className}`}>
          Track mentions for a date range
        </h3>
        <p className={`mt-2 text-sm text-app-muted ${bricolage_grot600.className}`}>
          Configure what to monitor and where. After you submit, we process your
          setup and add snapshots for each day in your range (up to the last 3
          months). You will not receive a separate email — check back here and use
          View date when data is ready.
        </p>
      </section>

      <form onSubmit={(e) => void onSubmit(e)} className="portal-glass-card space-y-6 p-6">
        <div>
          <p className={`text-sm font-semibold text-chambray ${bricolage_grot600.className}`}>
            Keywords
          </p>
          <p className="mt-1 text-xs text-app-muted">Up to 5 keywords or phrases</p>
          <ul className="mt-3 space-y-2">
            {keywords.map((row, index) => (
              <li key={index} className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={row.value}
                  onChange={(e) => {
                    const next = [...keywords]
                    next[index] = { ...next[index]!, value: e.target.value }
                    setKeywords(next)
                  }}
                  placeholder="e.g. your brand name"
                  className="portal-input min-w-[12rem] flex-1"
                  maxLength={50}
                />
                <select
                  value={row.matchType}
                  onChange={(e) => {
                    const next = [...keywords]
                    next[index] = {
                      ...next[index]!,
                      matchType: e.target.value as 'broad' | 'exact',
                    }
                    setKeywords(next)
                  }}
                  className="portal-input w-28"
                  aria-label={`Match type for keyword ${index + 1}`}
                >
                  <option value="broad">Broad</option>
                  <option value="exact">Exact</option>
                </select>
                {keywords.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setKeywords(keywords.filter((_, i) => i !== index))}
                    className="portal-btn-ghost text-xs"
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          {keywords.length < 5 ? (
            <button
              type="button"
              onClick={() =>
                setKeywords([...keywords, { value: '', matchType: 'broad' }])
              }
              className="portal-btn-ghost mt-2 text-sm"
            >
              Add keyword
            </button>
          ) : null}
        </div>

        <div>
          <p className={`text-sm font-semibold text-chambray ${bricolage_grot600.className}`}>
            Platforms
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ALL_PLATFORMS.map((id) => {
              const selected = platforms.includes(id)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => togglePlatform(id)}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${bricolage_grot600.className} ${
                    selected
                      ? 'bg-chambray text-white'
                      : 'bg-chambray/8 text-chambray hover:bg-chambray/12'
                  }`}
                  aria-pressed={selected}
                >
                  {PLATFORM_META[id].name}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-app-muted">
            <span className="font-semibold uppercase tracking-wide">Start date</span>
            <input
              type="date"
              value={startDate}
              min={minDate}
              max={endDate || maxDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="portal-input"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-app-muted">
            <span className="font-semibold uppercase tracking-wide">End date</span>
            <input
              type="date"
              value={endDate}
              min={startDate || minDate}
              max={maxDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="portal-input"
              required
            />
          </label>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-lg border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {success}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="portal-btn-primary text-sm"
          >
            {submitting ? 'Submitting…' : 'Create listening setup'}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={goToSummary}
            className="portal-btn-ghost text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
