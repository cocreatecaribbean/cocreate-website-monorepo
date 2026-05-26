'use client'

import PlatformIcon from '@/components/social-listening/platform-icon'
import { formatMetricDeltaLine } from '@/lib/social-listening/format-compare-delta'
import { PLATFORM_META } from '@/lib/social-listening/platform-meta'
import type { PlatformMentionDelta } from '@/lib/social-listening/platform-mention-deltas'
import type { SourceBreakdownRow } from '@/lib/social-listening/types'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'

type SourceBreakdownPlatformStripProps = {
  breakdown: SourceBreakdownRow[]
  deltas?: PlatformMentionDelta[] | null
  baselineDate?: string
  currentDate?: string
}

export default function SourceBreakdownPlatformStrip({
  breakdown,
  deltas,
  baselineDate,
  currentDate,
}: SourceBreakdownPlatformStripProps) {
  const compareMode = Boolean(
    deltas?.length && baselineDate && currentDate,
  )
  const deltaByPlatform = compareMode
    ? new Map(deltas!.map((d) => [d.platformId, d]))
    : null

  const sorted = [...breakdown].sort((a, b) => b.mentions - a.mentions)

  if (!sorted.length) return null

  return (
    <section
      className="portal-animate-in-delay-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Mentions by platform"
    >
      {sorted.map((row) => {
        const meta = PLATFORM_META[row.platformId]
        const delta = deltaByPlatform?.get(row.platformId)
        const changeUp = (delta?.change ?? 0) > 0
        const changeDown = (delta?.change ?? 0) < 0
        const deltaClass = changeUp
          ? 'text-sanmarino'
          : changeDown
            ? 'text-red-600'
            : 'text-slate-500'

        return (
          <article
            key={row.platformId}
            className="portal-glass-kpi flex items-start gap-3 rounded-xl p-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sanmarino/15 ring-1 ring-white/70">
              <PlatformIcon platformId={row.platformId} size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={`text-xs font-semibold uppercase tracking-wide text-slate-500 ${bricolage_grot600.className}`}
              >
                {meta.name}
              </p>
              <p
                className={`mt-1 text-lg tabular-nums text-chambray ${bricolage_grot700.className}`}
              >
                {(delta?.current ?? row.mentions).toLocaleString()}
                <span className="ml-1.5 text-sm font-normal text-slate-500">
                  mentions
                </span>
              </p>
              {compareMode && delta ? (
                <>
                  <p className="mt-1 text-xs text-slate-500">
                    Was {delta.baseline.toLocaleString()} on {baselineDate}
                  </p>
                  <p className={`mt-0.5 text-xs font-medium ${deltaClass}`}>
                    {formatMetricDeltaLine(delta, true)} ·{' '}
                    {formatMetricDeltaLine(delta)}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  Share of voice for this channel
                </p>
              )}
            </div>
          </article>
        )
      })}
      {compareMode && baselineDate && currentDate ? (
        <p className="col-span-full text-center text-xs text-slate-400">
          Comparing {currentDate} to baseline {baselineDate}
        </p>
      ) : null}
    </section>
  )
}
