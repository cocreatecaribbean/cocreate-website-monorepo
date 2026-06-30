'use client'

import SentimentFace from './sentiment-face'
import { formatPercent } from './nivo-theme'
import { SENTIMENT_LABELS } from '@cocreate/social-listening/core'
import { slFontSemibold, slFontBold } from './typography'
import { formatMetricDeltaLine } from '@cocreate/social-listening/core'
import type { SocialListeningMetricDelta } from '@cocreate/api-contracts/v1/social-listening'
import type { SentimentId, SocialListeningAnalytics } from '@cocreate/social-listening/core'

type KpiItem = {
  label: string
  primary: string
  secondary: string
  deltaLine?: string
  accentBar: string
  valueClass: string
  sentiment: SentimentId | null
}

function buildKpis(
  data: SocialListeningAnalytics,
  deltas?: SocialListeningCompareDeltas | null,
): KpiItem[] {
  const total = data.sentimentSummary.reduce((sum, s) => sum + s.value, 0)
  const positive = data.sentimentSummary.find((s) => s.id === 'positive')?.value ?? 0
  const negative = data.sentimentSummary.find((s) => s.id === 'negative')?.value ?? 0
  const neutral = data.sentimentSummary.find((s) => s.id === 'neutral')?.value ?? 0

  return [
    {
      label: 'Total mentions',
      primary: total.toLocaleString(),
      secondary: 'Across all tracked sources',
      deltaLine: deltas ? formatMetricDeltaLine(deltas.totalMentions) : undefined,
      accentBar: 'from-sanmarino via-casablanca to-chambray',
      valueClass: 'portal-sl-kpi-value',
      sentiment: null,
    },
    {
      label: SENTIMENT_LABELS.positive,
      primary: formatPercent(positive, total),
      secondary: `${positive.toLocaleString()} mentions`,
      deltaLine: deltas ? formatMetricDeltaLine(deltas.positive, true) : undefined,
      accentBar: 'from-sanmarino to-casablanca',
      valueClass: 'portal-sl-kpi-value-positive',
      sentiment: 'positive',
    },
    {
      label: SENTIMENT_LABELS.negative,
      primary: formatPercent(negative, total),
      secondary: `${negative.toLocaleString()} mentions`,
      deltaLine: deltas ? formatMetricDeltaLine(deltas.negative, true) : undefined,
      accentBar: 'from-chambray to-red-500',
      valueClass: 'portal-sl-kpi-value-negative',
      sentiment: 'negative',
    },
    {
      label: SENTIMENT_LABELS.neutral,
      primary: formatPercent(neutral, total),
      secondary: `${neutral.toLocaleString()} mentions`,
      deltaLine: deltas ? formatMetricDeltaLine(deltas.neutral, true) : undefined,
      accentBar: 'from-slate-300 via-sanmarino/40 to-sanmarino/60',
      valueClass: 'portal-sl-kpi-value-neutral',
      sentiment: 'neutral',
    },
  ]
}

type SocialListeningCompareDeltas = {
  totalMentions: SocialListeningMetricDelta
  positive: SocialListeningMetricDelta
  neutral: SocialListeningMetricDelta
  negative: SocialListeningMetricDelta
}

const STAGGER = [
  '',
  'portal-animate-in-delay-1',
  'portal-animate-in-delay-2',
  'portal-animate-in-delay-3',
] as const

type SentimentKpiStripProps = {
  data: SocialListeningAnalytics
  deltas?: SocialListeningCompareDeltas | null
}

export default function SentimentKpiStrip({ data, deltas }: SentimentKpiStripProps) {
  const kpis = buildKpis(data, deltas)

  return (
    <section
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-label="Mention summary"
    >
      {kpis.map((kpi, i) => (
        <article
          key={kpi.label}
          className={`portal-glass-kpi portal-animate-in relative flex min-h-[7.5rem] flex-col ${STAGGER[i] ?? ''}`}
        >
          <div
            className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${kpi.accentBar}`}
            aria-hidden
          />

          <div className="flex flex-1 flex-col gap-3 p-5 pt-4">
            <p className={`portal-sl-label ${slFontSemibold}`}>{kpi.label}</p>

            <div className="flex min-h-9 items-center gap-3">
              {kpi.sentiment ? (
                <SentimentFace sentiment={kpi.sentiment} size={30} className="shrink-0" />
              ) : null}
              <p
                className={`text-2xl leading-none tabular-nums sm:text-[1.65rem] ${slFontBold} ${kpi.valueClass}`}
              >
                {kpi.primary}
              </p>
            </div>

            <p className="portal-sl-caption leading-snug">{kpi.secondary}</p>
            {kpi.deltaLine ? <p className="portal-sl-delta">{kpi.deltaLine}</p> : null}
          </div>
        </article>
      ))}
    </section>
  )
}
