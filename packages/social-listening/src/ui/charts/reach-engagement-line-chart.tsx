'use client'

import { useMemo } from 'react'
import { Area, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import {
  ChartContainer as RechartsChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from '@cocreate/app-ui/chart'
import { usePortalChartCssVars, useReachEngagementChartConfig } from '@cocreate/app-ui/use-chart-theme'
import ChartContainer from '../chart-container'
import GlassChartTooltip from '../glass-tooltip'
import { brandColors } from '../chart-shared'
import { useIsMobileChart } from '../hooks/use-is-mobile-chart'
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion'
import type { ReachEngagementSeries } from '@cocreate/social-listening/core'

type ReachEngagementLineChartProps = {
  data: ReachEngagementSeries[]
}

type MergedPoint = {
  label: string
  reach: number
  engagement: number
}

function mergeReachEngagementSeries(series: ReachEngagementSeries[]): MergedPoint[] {
  const reachSeries = series.find((item) => item.id.toLowerCase().includes('reach'))
  const engagementSeries = series.find((item) => item.id.toLowerCase().includes('engagement'))
  if (!reachSeries?.data.length) return []

  return reachSeries.data.map((point, index) => ({
    label: point.x,
    reach: point.y,
    engagement: engagementSeries?.data[index]?.y ?? 0,
  }))
}

export default function ReachEngagementLineChart({ data }: ReachEngagementLineChartProps) {
  const reducedMotion = usePrefersReducedMotion()
  const isMobile = useIsMobileChart()
  const chartConfig = useReachEngagementChartConfig()
  const chartCssVars = usePortalChartCssVars()

  const chartData = useMemo(() => mergeReachEngagementSeries(data), [data])

  const margin = isMobile
    ? { top: 16, right: 16, bottom: 8, left: 4 }
    : { top: 24, right: 28, bottom: 8, left: 12 }

  return (
    <ChartContainer label="Reach versus engagement line chart" size="md">
      <RechartsChartContainer
        config={chartConfig}
        className="portal-chart-glow h-full w-full"
        style={chartCssVars}
      >
        <LineChart data={chartData} margin={margin}>
          <defs>
            <linearGradient id="grad-reach" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={brandColors.chambray} stopOpacity={0.35} />
              <stop offset="100%" stopColor={brandColors.chambray} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-engage" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={brandColors.casablanca} stopOpacity={0.4} />
              <stop offset="100%" stopColor={brandColors.casablanca} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
          />
          <ChartTooltip
            cursor={{ stroke: 'var(--chart-grid)' }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const item = payload[0]
              const key = String(item.dataKey ?? '')
              const accent =
                key === 'reach'
                  ? 'rgba(57, 65, 154, 0.25)'
                  : 'rgba(246, 176, 63, 0.35)'
              const seriesLabel =
                key === 'reach'
                  ? chartConfig.reach.label
                  : chartConfig.engagement.label
              return (
                <GlassChartTooltip accent={accent}>
                  <strong className="text-chambray">{seriesLabel}</strong>
                  <div className="portal-sl-secondary">
                    {label}: {Number(item.value).toLocaleString()}
                  </div>
                </GlassChartTooltip>
              )
            }}
          />
          <ChartLegend
            verticalAlign="bottom"
            content={
              <ChartLegendContent
                className={isMobile ? 'flex-col gap-2' : 'flex-row gap-8'}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="reach"
            stroke="none"
            fill="url(#grad-reach)"
            fillOpacity={0.18}
            isAnimationActive={!reducedMotion}
          />
          <Area
            type="monotone"
            dataKey="engagement"
            stroke="none"
            fill="url(#grad-engage)"
            fillOpacity={0.18}
            isAnimationActive={!reducedMotion}
          />
          <Line
            type="monotone"
            dataKey="reach"
            stroke="var(--color-reach)"
            strokeWidth={3}
            dot={{ r: 5, fill: 'var(--color-reach)', stroke: '#ffffff', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            isAnimationActive={!reducedMotion}
          />
          <Line
            type="monotone"
            dataKey="engagement"
            stroke="var(--color-engagement)"
            strokeWidth={3}
            dot={{ r: 5, fill: 'var(--color-engagement)', stroke: '#ffffff', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            isAnimationActive={!reducedMotion}
          />
        </LineChart>
      </RechartsChartContainer>
    </ChartContainer>
  )
}
