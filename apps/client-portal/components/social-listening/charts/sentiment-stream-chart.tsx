'use client'

import { useCallback, useMemo } from 'react'
import { ResponsiveStream, type StackTooltipProps } from '@nivo/stream'
import SentimentFace from '@client-portal/components/social-listening/sentiment-face'
import {
  sentimentStreamColors,
  sentimentStreamKeys,
} from '@client-portal/components/social-listening/nivo-theme'
import { useNivoTheme } from '@client-portal/components/social-listening/use-nivo-theme'
import { useTheme } from 'next-themes'
import { useIsMobileChart } from '@client-portal/components/social-listening/use-is-mobile-chart'
import { usePrefersReducedMotion } from '@client-portal/components/social-listening/use-prefers-reduced-motion'
import { SENTIMENT_LABELS } from '@client-portal/lib/social-listening/sentiment-meta'
import type { SentimentId, SentimentOverTimeRow } from '@client-portal/lib/social-listening/types'

type SentimentStreamChartProps = {
  data: SentimentOverTimeRow[]
}

function formatDateLabel(iso: string, short = false): string {
  const date = new Date(iso + 'T12:00:00')
  if (short) {
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const legendSentiments: SentimentId[] = ['positive', 'neutral', 'negative']

export default function SentimentStreamChart({ data }: SentimentStreamChartProps) {
  const reducedMotion = usePrefersReducedMotion()
  const isMobile = useIsMobileChart()
  const nivoTheme = useNivoTheme()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const streamData = useMemo(
    () =>
      data.map((row) => ({
        date: formatDateLabel(row.date, isMobile),
        positive: row.positive,
        neutral: row.neutral,
        negative: row.negative,
      })),
    [data, isMobile],
  )

  const margin = isMobile
    ? { top: 8, right: 8, bottom: 44, left: 28 }
    : { top: 16, right: 20, bottom: 48, left: 44 }

  const streamTheme = useMemo(
    () => ({
      ...nivoTheme,
      tooltip: {
        container: {
          background: isDark ? 'rgba(24, 30, 58, 0.95)' : 'rgba(57, 65, 154, 0.92)',
          color: '#ffffff',
          fontSize: 12,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
          padding: '8px 12px',
          borderRadius: 8,
        },
      },
    }),
    [nivoTheme, isDark],
  )

  const stackTooltip = useCallback(
    ({ slice }: StackTooltipProps) => (
      <div
        className="rounded-lg border border-white/15 bg-chambray/95 px-3 py-2 text-xs text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-sm"
        role="tooltip"
      >
        <p className="mb-1.5 border-b border-white/15 pb-1.5 font-semibold text-white/90">
          {streamData[slice.index]?.date ?? ''}
        </p>
        <ul className="space-y-1">
          {[...slice.stack].reverse().map((layer) => (
            <li
              key={String(layer.layerId)}
              className="flex items-center gap-2 tabular-nums"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm ring-1 ring-white/25"
                style={{ backgroundColor: layer.color }}
                aria-hidden
              />
              <span className="capitalize">{String(layer.layerId)}</span>
              <span className="ml-auto font-medium">{layer.formattedValue}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
    [streamData],
  )

  return (
    <div
      role="img"
      aria-label="Sentiment over time stream chart"
      className="flex w-full flex-col gap-3"
    >
      <ul
        className="flex shrink-0 gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:justify-end [&::-webkit-scrollbar]:hidden"
        aria-label="Sentiment legend"
      >
        {legendSentiments.map((id) => (
          <li
            key={id}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-app bg-app-input px-2 py-1 text-xs font-medium text-app-heading backdrop-blur-sm"
          >
            <SentimentFace sentiment={id} size={18} />
            <span>{SENTIMENT_LABELS[id]}</span>
          </li>
        ))}
      </ul>

      {/* Fixed aspect on small screens so Nivo does not stretch with flex parents */}
      <div
        className="
          relative w-full
          h-[220px] max-h-[42vw] min-h-[200px]
          sm:h-[280px] sm:max-h-none
          md:h-[300px]
        "
      >
        <ResponsiveStream
          data={streamData}
          keys={[...sentimentStreamKeys]}
          margin={margin}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 0,
            tickPadding: 6,
            tickRotation: isMobile ? -40 : 0,
            format: (value) => streamData[Number(value)]?.date ?? String(value),
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 4,
            format: isMobile ? (v) => `${Number(v) * 100}%` : undefined,
          }}
          enableGridX={false}
          enableGridY={!isMobile}
          colors={sentimentStreamColors}
          fillOpacity={0.9}
          borderWidth={0}
          curve="monotoneX"
          offsetType="expand"
          theme={streamTheme}
          stackTooltip={stackTooltip}
          animate={!reducedMotion}
          motionConfig={reducedMotion ? 'none' : 'gentle'}
          legends={[]}
        />
      </div>
    </div>
  )
}
