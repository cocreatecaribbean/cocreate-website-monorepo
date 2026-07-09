'use client'

import PlatformIcon from './platform-icon'
import { formatMetricDeltaCompact } from '@cocreate/social-listening/core'
import { PLATFORM_META, resolvePlatformId } from '@cocreate/social-listening/core'
import type { PlatformMentionDelta } from '@cocreate/social-listening/core'
import type { SourceBreakdownRow } from '@cocreate/social-listening/core'
import { slFontSemibold, slFontBold } from './typography'

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
      className="portal-animate-in-delay-1 grid grid-cols-[repeat(auto-fill,minmax(min(100%,13.5rem),1fr))] gap-3"
      aria-label="Mentions by platform"
    >
      {sorted.map((row) => {
        const platformId = resolvePlatformId(row.platformId)
        const meta = PLATFORM_META[platformId]
        const delta = deltaByPlatform?.get(platformId)
        const changeUp = (delta?.change ?? 0) > 0
        const changeDown = (delta?.change ?? 0) < 0
        const deltaClass = changeUp
          ? 'text-sanmarino'
          : changeDown
            ? 'text-red-600'
            : 'portal-sl-secondary'

        return (
          <article
            key={row.platformId}
            className="portal-glass-kpi flex items-start gap-3 rounded-xl p-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sanmarino/15 ring-1 ring-white/70">
              <PlatformIcon platformId={platformId} size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={`text-xs font-semibold uppercase tracking-wide portal-sl-secondary ${slFontSemibold}`}
              >
                {meta.name}
              </p>
              <p
                className={`portal-sl-kpi-value mt-1 text-lg tabular-nums ${slFontBold}`}
              >
                {(delta?.current ?? row.mentions).toLocaleString()}
                <span className="ml-1.5 text-sm font-normal portal-sl-secondary">
                  mentions
                </span>
              </p>
              {compareMode && delta ? (
                <>
                  <p className="mt-1 text-xs portal-sl-secondary">
                    Was {delta.baseline.toLocaleString()} on {baselineDate}
                  </p>
                  <p className={`mt-0.5 text-xs font-medium leading-snug ${deltaClass}`}>
                    {formatMetricDeltaCompact(delta)}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-xs portal-sl-secondary">
                  Share of voice for this channel
                </p>
              )}
            </div>
          </article>
        )
      })}
      {compareMode && baselineDate && currentDate ? (
        <p className="col-span-full text-center text-xs portal-sl-caption">
          Comparing {currentDate} to baseline {baselineDate}
        </p>
      ) : null}
    </section>
  )
}
