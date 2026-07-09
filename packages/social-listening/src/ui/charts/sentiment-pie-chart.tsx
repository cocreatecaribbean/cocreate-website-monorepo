'use client'

import { useMemo } from 'react'
import { Cell, Pie, PieChart } from 'recharts'
import { ChartContainer as RechartsChartContainer, ChartTooltip } from '@cocreate/app-ui/chart'
import { getSentimentPieChartConfig } from '@cocreate/app-ui/chart-theme'
import { usePortalChartCssVars } from '@cocreate/app-ui/use-chart-theme'
import ChartContainer from '../chart-container'
import GlassChartTooltip from '../glass-tooltip'
import SentimentFace from '../sentiment-face'
import { formatPercent } from '../chart-shared'
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion'
import { SENTIMENT_BRAND_COLORS, SENTIMENT_LABELS } from '@cocreate/social-listening/core'
import type { SentimentId, SentimentSlice } from '@cocreate/social-listening/core'

type SentimentPieChartProps = {
  data: SentimentSlice[]
}

function dominantSentiment(data: SentimentSlice[]): SentimentId {
  return data.reduce((best, slice) => (slice.value > best.value ? slice : best)).id
}

export default function SentimentPieChart({ data }: SentimentPieChartProps) {
  const reducedMotion = usePrefersReducedMotion()
  const chartCssVars = usePortalChartCssVars()
  const total = data.reduce((sum, slice) => sum + slice.value, 0)
  const dominant = useMemo(() => dominantSentiment(data), [data])
  const chartConfig = useMemo(() => getSentimentPieChartConfig(), [])

  const pieData = data.map((slice) => ({
    ...slice,
    color: SENTIMENT_BRAND_COLORS[slice.id],
  }))

  return (
    <div className="flex flex-col">
      <ChartContainer label="Sentiment breakdown pie chart" size="sm">
        <div className="relative h-full w-full">
          <RechartsChartContainer
            config={chartConfig}
            className="portal-chart-glow h-full w-full"
            style={chartCssVars}
          >
            <PieChart>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const slice = payload[0].payload as SentimentSlice & { color: string }
                  const id = slice.id as SentimentId
                  return (
                    <GlassChartTooltip>
                      <div className="flex items-center gap-2">
                        <SentimentFace sentiment={id} size={28} />
                        <div>
                          <strong className="text-chambray">{SENTIMENT_LABELS[id]}</strong>
                          <div className="portal-sl-secondary">
                            {slice.value.toLocaleString()} ({formatPercent(slice.value, total)})
                          </div>
                        </div>
                      </div>
                    </GlassChartTooltip>
                  )
                }}
              />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="id"
                innerRadius="52%"
                outerRadius="80%"
                paddingAngle={2}
                cornerRadius={6}
                strokeWidth={0}
                isAnimationActive={!reducedMotion}
              >
                {pieData.map((slice) => (
                  <Cell key={slice.id} fill={slice.color} />
                ))}
              </Pie>
            </PieChart>
          </RechartsChartContainer>

          <div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
            aria-hidden
          >
            <div className="portal-sentiment-pie-center flex h-[clamp(64px,22cqw,84px)] w-[clamp(64px,22cqw,84px)] flex-col items-center justify-center rounded-full border border-sanmarino/15 bg-white/75 shadow-inner">
              <SentimentFace sentiment={dominant} size={40} animated={!reducedMotion} />
              <p className="mt-0.5 text-[clamp(11px,3cqw,15px)] font-bold text-chambray">
                {total.toLocaleString()}
              </p>
              <p className="text-[clamp(8px,2.2cqw,10px)] font-medium text-slate-500">mentions</p>
            </div>
          </div>
        </div>
      </ChartContainer>

      <ul
        className="portal-sentiment-pie-legend mt-2 flex flex-wrap justify-center gap-3 sm:gap-5"
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
                <p className="tabular-nums portal-sl-secondary">
                  {formatPercent(slice.value, total)} · {slice.value.toLocaleString()}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
