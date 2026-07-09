'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import {
  ChartContainer as RechartsChartContainer,
  ChartTooltip,
} from '@cocreate/app-ui/chart'
import { usePortalChartCssVars } from '@cocreate/app-ui/use-chart-theme'
import ChartContainer from '../chart-container'
import GlassChartTooltip from '../glass-tooltip'
import { brandColors } from '../chart-shared'
import { useIsMobileChart } from '../hooks/use-is-mobile-chart'
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion'
import type { MonthlyTrendPoint } from '@cocreate/social-listening/core'

type MonthlyMentionsTrendChartProps = {
  points: MonthlyTrendPoint[]
}

export default function MonthlyMentionsTrendChart({
  points,
}: MonthlyMentionsTrendChartProps) {
  const reducedMotion = usePrefersReducedMotion()
  const isMobile = useIsMobileChart()
  const chartCssVars = usePortalChartCssVars()

  const chartData = useMemo(
    () =>
      points.map((point) => ({
        monthKey: point.monthKey,
        label: point.monthLabel,
        periodLabel: point.periodLabel,
        mentions: point.totalMentions,
      })),
    [points],
  )

  const margin = isMobile
    ? { top: 16, right: 12, bottom: 8, left: 4 }
    : { top: 24, right: 24, bottom: 8, left: 12 }

  const xInterval = chartData.length > 6 ? ('preserveStartEnd' as const) : 0

  return (
    <ChartContainer label="Monthly mention trend chart" size="md">
      <RechartsChartContainer
        config={{
          mentions: {
            label: 'Total mentions',
            color: brandColors.chambray,
          },
        }}
        className="portal-chart-glow h-full w-full"
        style={chartCssVars}
      >
        <BarChart
          data={chartData}
          margin={margin}
          barCategoryGap="20%"
        >
          <defs>
            <linearGradient id="grad-monthly-mentions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={brandColors.sanmarino} stopOpacity={0.95} />
              <stop offset="100%" stopColor={brandColors.chambray} stopOpacity={0.85} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
            interval={xInterval}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
          />
          <ChartTooltip
            cursor={{ fill: 'rgba(57, 65, 154, 0.08)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const item = payload[0]?.payload as (typeof chartData)[number] | undefined
              if (!item) return null
              return (
                <GlassChartTooltip accent="rgba(57, 65, 154, 0.25)">
                  <strong className="text-chambray">{item.label}</strong>
                  <div className="portal-sl-secondary">{item.periodLabel}</div>
                  <div className="mt-1 tabular-nums font-medium text-chambray">
                    {item.mentions.toLocaleString()} mentions
                  </div>
                </GlassChartTooltip>
              )
            }}
          />
          <Bar
            dataKey="mentions"
            fill="url(#grad-monthly-mentions)"
            radius={[8, 8, 0, 0]}
            maxBarSize={48}
            isAnimationActive={!reducedMotion}
          >
            {chartData.map((entry) => (
              <Cell key={entry.monthKey} fill="url(#grad-monthly-mentions)" />
            ))}
          </Bar>
        </BarChart>
      </RechartsChartContainer>
    </ChartContainer>
  )
}
