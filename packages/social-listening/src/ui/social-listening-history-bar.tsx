'use client'

import { useMemo } from 'react'
import {
  formatSnapshotOptionLabel,
  useSnapshotDates,
  type SocialListeningSnapshotDateEntry,
} from '@cocreate/social-listening/data-source'
import { slFontSemibold } from './typography'

type SocialListeningHistoryBarProps = {
  organizationName?: string | null
  asOf: string | null
  compareEnabled: boolean
  compareBaseline: string | null
  onAsOfChange: (date: string | null) => void
  onCompareEnabledChange: (enabled: boolean) => void
  onCompareBaselineChange: (date: string | null) => void
}

type SnapshotGroup = {
  label: string
  entries: SocialListeningSnapshotDateEntry[]
}

function groupSnapshots(entries: SocialListeningSnapshotDateEntry[]): SnapshotGroup[] {
  if (!entries.length) return []

  const latest = entries[0]!
  const latestDate = new Date(`${latest.date}T00:00:00.000Z`)
  const recentCutoff = new Date(latestDate)
  recentCutoff.setUTCDate(recentCutoff.getUTCDate() - 90)

  const recentMonths: SocialListeningSnapshotDateEntry[] = []
  const earlier: SocialListeningSnapshotDateEntry[] = []

  for (let i = 1; i < entries.length; i++) {
    const entry = entries[i]!
    const d = new Date(`${entry.date}T00:00:00.000Z`)
    if (d >= recentCutoff) {
      recentMonths.push(entry)
    } else {
      earlier.push(entry)
    }
  }

  const groups: SnapshotGroup[] = []
  if (recentMonths.length) groups.push({ label: 'Recent months', entries: recentMonths })
  if (earlier.length) groups.push({ label: 'Earlier', entries: earlier })
  return groups
}

export default function SocialListeningHistoryBar({
  organizationName,
  asOf,
  compareEnabled,
  compareBaseline,
  onAsOfChange,
  onCompareEnabledChange,
  onCompareBaselineChange,
}: SocialListeningHistoryBarProps) {
  const { snapshots, organizationName: contextOrgName } = useSnapshotDates()
  const resolvedOrgName = organizationName ?? contextOrgName

  const dates = useMemo(() => snapshots.map((s) => s.date), [snapshots])
  const latestDate = dates[0] ?? null
  const latestOptionLabel = latestDate ? `Latest (${latestDate})` : 'Latest'
  const groups = useMemo(() => groupSnapshots(snapshots), [snapshots])

  const compareCurrentLabel = asOf ?? latestDate ?? 'latest'
  const compareBaselineLabel = compareBaseline ?? '—'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-app-muted">
        <p className={slFontSemibold}>
          {resolvedOrgName ? (
            <>
              Data for{' '}
              <span className="text-app-primary">{resolvedOrgName}</span>
            </>
          ) : (
            'Your organization'
          )}
          {snapshots.length > 0 ? (
            <span>
              {' '}
              · {snapshots.length} saved snapshot{snapshots.length === 1 ? '' : 's'}
            </span>
          ) : null}
        </p>
      </div>

      <div
        className={`flex flex-wrap items-end gap-4 rounded-xl border border-app bg-app-input px-4 py-3 shadow-sm backdrop-blur-sm ${slFontSemibold}`}
      >
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs text-app-muted sm:max-w-md">
          <span className="font-semibold uppercase tracking-wide text-app-muted">
            View date
          </span>
          <select
            className="portal-input rounded-lg py-2 text-sm"
            value={asOf ?? ''}
            onChange={(e) => onAsOfChange(e.target.value || null)}
          >
            <option value="">{latestOptionLabel}</option>
            {groups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.entries.map((entry) => (
                  <option key={entry.date} value={entry.date}>
                    {formatSnapshotOptionLabel(entry)}
                    {entry.source === 'brand24' ? ' · Live' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 pb-2 text-sm text-app-primary">
          <input
            type="checkbox"
            className="size-4 rounded border-app text-sanmarino"
            checked={compareEnabled}
            onChange={(e) => onCompareEnabledChange(e.target.checked)}
          />
          Compare to
        </label>

        {compareEnabled ? (
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs text-app-muted sm:max-w-md">
            <span className="font-semibold uppercase tracking-wide text-app-muted">
              Baseline date
            </span>
            <select
              className="portal-input rounded-lg py-2 text-sm"
              value={compareBaseline ?? ''}
              onChange={(e) => onCompareBaselineChange(e.target.value || null)}
            >
              <option value="">Select baseline…</option>
              {groups.map((group) => (
                <optgroup key={`baseline-${group.label}`} label={group.label}>
                  {group.entries
                    .filter((entry) => entry.date !== (asOf ?? latestDate))
                    .map((entry) => (
                      <option key={entry.date} value={entry.date}>
                        {formatSnapshotOptionLabel(entry)}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
        ) : null}

        {compareEnabled && compareBaseline ? (
          <span className="mb-2 inline-flex items-center rounded-full border border-sanmarino/25 bg-sanmarino/10 px-3 py-1 text-xs font-medium text-chambray">
            {compareCurrentLabel} vs baseline {compareBaselineLabel}
          </span>
        ) : null}
      </div>
    </div>
  )
}
