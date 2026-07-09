'use client'

import { resolveDataSourceLabel } from '@cocreate/social-listening/data-source'
import { slFontSemibold } from './typography'

type DataSourceStatusStripProps = {
  organizationName?: string | null
  snapshotCount?: number
  source: 'brand24' | 'org_mock'
  snapshotDate?: string | null
}

const badgeStyles = {
  live: 'border-emerald-300/60 bg-emerald-50/90 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200',
  demo: 'border-amber-300/60 bg-amber-50/90 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200',
  mock: 'border-sanmarino/25 bg-sanmarino/8 text-chambray dark:text-sanmarino',
} as const

export default function DataSourceStatusStrip({
  organizationName,
  snapshotCount,
  source,
  snapshotDate,
}: DataSourceStatusStripProps) {
  const { label, title } = resolveDataSourceLabel(source)

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-app bg-app-input/80 px-4 py-2.5 text-xs backdrop-blur-sm ${slFontSemibold}`}
    >
      <div className="flex flex-wrap items-center gap-2 text-app-muted">
        {organizationName ? (
          <span>
            Data for <span className="text-app-primary">{organizationName}</span>
          </span>
        ) : null}
        {typeof snapshotCount === 'number' ? (
          <span className="text-app-muted">
            · {snapshotCount} saved snapshot{snapshotCount === 1 ? '' : 's'}
          </span>
        ) : null}
        {snapshotDate ? (
          <span className="text-app-muted">· viewing {snapshotDate}</span>
        ) : null}
      </div>
      <span
        className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 font-semibold uppercase tracking-wide ${badgeStyles[label]}`}
      >
        {title}
      </span>
    </div>
  )
}
