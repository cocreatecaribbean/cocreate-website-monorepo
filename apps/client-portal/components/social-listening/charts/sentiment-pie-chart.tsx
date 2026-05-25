'use client'

import { useMemo } from 'react'
import { ResponsivePie } from '@nivo/pie'
import ChartContainer from '@/components/social-listening/chart-container'
import GlassChartTooltip from '@/components/social-listening/glass-tooltip'
import SentimentFace from '@/components/social-listening/sentiment-face'
import { formatPercent, nivoTheme } from '@/components/social-listening/nivo-theme'
import { usePrefersReducedMotion } from '@/components/social-listening/use-prefers-reduced-motion'
import { SENTIMENT_BRAND_COLORS, SENTIMENT_LABELS } from '@/lib/social-listening/sentiment-meta'
import type { SentimentId, SentimentSlice } from '@/lib/social-listening/types'

type SentimentPieChartProps = {
  data: SentimentSlice[]
}

function dominantSentiment(data: SentimentSlice[]): SentimentId {
  return data.reduce((best, slice) =>
    slice.value > best.value ? slice : best,
  ).id
}

export default function SentimentPieChart({ data }: SentimentPieChartProps) {
  const reducedMotion = usePrefersReducedMotion()
  const total = data.reduce((sum, slice) => sum + slice.value, 0)
  const dominant = useMemo(() => dominantSentiment(data), [data])

  const pieData = data.map((slice) => ({
    ...slice,
    color: SENTIMENT_BRAND_COLORS[slice.id],
  }))

  return (
    <ChartContainer
      label="Sentiment breakdown pie chart"
      minHeight="min-h-[260px] sm:min-h-[320px]"
    >
      <div className="relative h-[min(280px,50vw)] min-h-[240px] sm:min-h-[280px]">
        <ResponsivePie
          data={pieData}
          id="id"
          value="value"
          sortByValue
          innerRadius={0.52}
          padAngle={2}
          cornerRadius={6}
          activeOuterRadiusOffset={10}
          activeInnerRadiusOffset={4}
          colors={{ datum: 'data.color' }}
          theme={nivoTheme}
          animate={!reducedMotion}
          motionConfig={reducedMotion ? 'none' : 'wobbly'}
          enableArcLabels={false}
          enableArcLinkLabels={false}
          legends={[]}
          tooltip={({ datum }) => {
            const id = datum.id as SentimentId
            return (
              <GlassChartTooltip>
                <div className="flex items-center gap-2">
                  <SentimentFace sentiment={id} size={28} />
                  <div>
                    <strong className="text-chambray">{SENTIMENT_LABELS[id]}</strong>
                    <div className="text-slate-600">
                      {datum.value.toLocaleString()} ({formatPercent(datum.value, total)})
                    </div>
                  </div>
                </div>
              </GlassChartTooltip>
            )
          }}
          layers={[
            'arcs',
            'arcLabels',
            'arcLinkLabels',
            'legends',
            ({ centerX, centerY }) => (
              <g transform={`translate(${centerX}, ${centerY})`}>
                <circle
                  r={42}
                  fill="rgba(255,255,255,0.75)"
                  stroke="rgba(64,110,181,0.15)"
                  strokeWidth={1}
                />
                <foreignObject x={-24} y={-38} width={48} height={48}>
                  <div className="flex h-full w-full items-center justify-center">
                    <SentimentFace sentiment={dominant} size={40} animated={!reducedMotion} />
                  </div>
                </foreignObject>
                <text
                  y={28}
                  textAnchor="middle"
                  style={{ fill: '#39419a', fontSize: 15, fontWeight: 700 }}
                >
                  {total.toLocaleString()}
                </text>
                <text
                  y={44}
                  textAnchor="middle"
                  style={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                >
                  mentions
                </text>
              </g>
            ),
          ]}
        />
      </div>

      <ul
        className="mt-2 flex flex-wrap justify-center gap-3 sm:gap-5"
        aria-label="Sentiment legend"
      >
        {data.map((slice, i) => {
          const delays = [
            'portal-animate-in-delay-1',
            'portal-animate-in-delay-2',
            'portal-animate-in-delay-3',
          ] as const
          return (
          <li
            key={slice.id}
            className={`portal-glass-card portal-animate-in flex items-center gap-2.5 rounded-2xl px-3 py-2 ${delays[i] ?? ''}`}
          >
            <SentimentFace sentiment={slice.id} size={24} />
            <div className="text-left text-xs">
              <p className="font-semibold text-chambray">{SENTIMENT_LABELS[slice.id]}</p>
              <p className="tabular-nums text-slate-500">
                {formatPercent(slice.value, total)} · {slice.value.toLocaleString()}
              </p>
            </div>
          </li>
          )
        })}
      </ul>
    </ChartContainer>
  )
}
