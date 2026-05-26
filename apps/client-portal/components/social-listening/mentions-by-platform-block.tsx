'use client'

import { useState } from 'react'
import SourceBarChart from '@/components/social-listening/charts/source-bar-chart'
import ChartCard from '@/components/social-listening/chart-card'
import SourceBreakdownPlatformStrip from '@/components/social-listening/source-breakdown-platform-strip'
import { computePlatformMentionDeltas } from '@/lib/social-listening/platform-mention-deltas'
import type { SocialListeningAnalytics } from '@/lib/social-listening/types'
import { bricolage_grot600 } from '@/styles/fonts'

export type PlatformMentionsViewMode = 'bars' | 'cards'

type MentionsByPlatformBlockProps = {
  data: SocialListeningAnalytics
  platformMentionDeltas: ReturnType<typeof computePlatformMentionDeltas> | null
  compareBaselineDate?: string
  compareCurrentDate?: string
  platformCompareActive: boolean
  delayClass?: string
  description?: string
}

const VIEW_OPTIONS: { value: PlatformMentionsViewMode; label: string }[] = [
  { value: 'bars', label: 'Bar chart' },
  { value: 'cards', label: 'Cards' },
]

export default function MentionsByPlatformBlock({
  data,
  platformMentionDeltas,
  compareBaselineDate,
  compareCurrentDate,
  platformCompareActive,
  delayClass,
  description = 'Where your brand is being discussed',
}: MentionsByPlatformBlockProps) {
  const [viewMode, setViewMode] = useState<PlatformMentionsViewMode>('bars')
  const breakdown = data.sourceBreakdown ?? []

  const compareDescription =
    platformCompareActive && compareBaselineDate
      ? viewMode === 'bars'
        ? `Current period vs baseline ${compareBaselineDate} — hover bars for per-platform change`
        : `Current period vs baseline ${compareBaselineDate}`
      : description

  const viewSelect = (
    <label className={`flex flex-col gap-1 text-xs text-slate-600 ${bricolage_grot600.className}`}>
      <span className="font-semibold uppercase tracking-wide text-slate-500">View</span>
      <select
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-chambray"
        value={viewMode}
        onChange={(e) => setViewMode(e.target.value as PlatformMentionsViewMode)}
        aria-label="Mentions by platform view"
      >
        {VIEW_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )

  if (!breakdown.length) {
    return (
      <ChartCard
        title="Mentions by platform"
        description={description}
        delayClass={delayClass}
        headerAction={viewSelect}
      >
        <p className="py-12 text-center text-sm text-slate-500">
          No platform breakdown available for this snapshot.
        </p>
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title="Mentions by platform"
      description={compareDescription}
      delayClass={delayClass}
      headerAction={viewSelect}
      compact={viewMode === 'cards'}
    >
      {viewMode === 'bars' ? (
        <SourceBarChart
          data={breakdown}
          platformDeltas={platformMentionDeltas}
        />
      ) : (
        <SourceBreakdownPlatformStrip
          breakdown={breakdown}
          deltas={platformCompareActive ? platformMentionDeltas : null}
          baselineDate={compareBaselineDate}
          currentDate={compareCurrentDate}
        />
      )}
    </ChartCard>
  )
}
