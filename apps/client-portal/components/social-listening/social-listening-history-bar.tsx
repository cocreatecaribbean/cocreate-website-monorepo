'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchSocialListeningSnapshotDates } from '@/lib/social-listening/fetch-analytics-client'
import { bricolage_grot600 } from '@/styles/fonts'

type SocialListeningHistoryBarProps = {
  asOf: string | null
  compareEnabled: boolean
  compareBaseline: string | null
  onAsOfChange: (date: string | null) => void
  onCompareEnabledChange: (enabled: boolean) => void
  onCompareBaselineChange: (date: string | null) => void
}

export default function SocialListeningHistoryBar({
  asOf,
  compareEnabled,
  compareBaseline,
  onAsOfChange,
  onCompareEnabledChange,
  onCompareBaselineChange,
}: SocialListeningHistoryBarProps) {
  const [dates, setDates] = useState<string[]>([])
  const latestDate = dates[0] ?? null
  const latestOptionLabel = latestDate ? `Latest (${latestDate})` : 'Latest'

  const loadDates = useCallback(async () => {
    const list = await fetchSocialListeningSnapshotDates()
    setDates(list)
  }, [])

  useEffect(() => {
    void loadDates()
  }, [loadDates])

  return (
    <div
      className={`flex flex-wrap items-end gap-4 rounded-xl border border-slate-200/80 bg-white/60 px-4 py-3 shadow-sm backdrop-blur-sm ${bricolage_grot600.className}`}
    >
      <label className="flex min-w-[10rem] flex-col gap-1 text-xs text-slate-600">
        <span className="font-semibold uppercase tracking-wide text-slate-500">
          View date
        </span>
        <select
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-chambray"
          value={asOf ?? ''}
          onChange={(e) => onAsOfChange(e.target.value || null)}
        >
          <option value="">{latestOptionLabel}</option>
          {dates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="size-4 rounded border-slate-300 text-sanmarino"
          checked={compareEnabled}
          onChange={(e) => onCompareEnabledChange(e.target.checked)}
        />
        Compare to
      </label>

      {compareEnabled ? (
        <label className="flex min-w-[10rem] flex-col gap-1 text-xs text-slate-600">
          <span className="font-semibold uppercase tracking-wide text-slate-500">
            Baseline date
          </span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-chambray"
            value={compareBaseline ?? ''}
            onChange={(e) => onCompareBaselineChange(e.target.value || null)}
          >
            <option value="">Select date…</option>
            {dates
              .filter((d) => d !== (asOf ?? latestDate))
              .map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
          </select>
        </label>
      ) : null}
    </div>
  )
}
