'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { ChartContainer as RechartsChartContainer, ChartTooltip } from '@cocreate/app-ui/chart'
import { usePortalChartCssVars } from '@cocreate/app-ui/use-chart-theme'
import ChartContainer from '../chart-container'
import GlassChartTooltip from '../glass-tooltip'
import PlatformIcon from '../platform-icon'
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion'
import {
  computeBarChartLeftMargin,
  useChartLayoutTier,
  type ChartLabelMode,
} from '../hooks/use-chart-layout-tier'
import {
  PLATFORM_BAR_GRADIENTS,
  platformGradientDefId,
} from '@cocreate/social-listening/core'
import {
  PLATFORM_META,
  platformAxisLabel,
  resolvePlatformId,
  type SocialPlatformId,
} from '@cocreate/social-listening/core'
import { formatMetricDeltaLine } from '@cocreate/social-listening/core'
import type { PlatformMentionDelta } from '@cocreate/social-listening/core'
import type { SourceBreakdownRow } from '@cocreate/social-listening/core'

type ChartRow = Omit<SourceBreakdownRow, 'platformId'> & {
  platformId: SocialPlatformId
  platformLabel: string
}

type SourceBarChartProps = {
  data: SourceBreakdownRow[]
  platformDeltas?: PlatformMentionDelta[] | null
}

type AxisTickProps = {
  x?: number
  y?: number
  payload?: { value: string }
  labelMode: ChartLabelMode
  leftMargin: number
}

function platformBarFill(platformId: SocialPlatformId): string {
  if (platformId === 'facebook') return '#1877F2'
  const grad = PLATFORM_BAR_GRADIENTS[platformId]
  return `url(#${platformGradientDefId(platformId)})`
}

function PlatformYAxisTick({ x = 0, y = 0, payload, labelMode, leftMargin }: AxisTickProps) {
  const platformId = String(payload?.value ?? '') as SocialPlatformId
  const meta = PLATFORM_META[platformId]
  if (!meta) return <g />

  const grad = PLATFORM_BAR_GRADIENTS[platformId]
  const axisText = platformAxisLabel(platformId, labelMode)
  const iconOnly = labelMode === 'icon'

  return (
    <foreignObject
      x={x - leftMargin}
      y={y - 12}
      width={leftMargin}
      height={24}
      overflow="visible"
    >
      <div
        className={`flex h-6 items-center font-medium text-chambray ${iconOnly ? 'justify-center' : 'gap-1.5'} ${labelMode === 'abbrev' ? 'text-xs' : 'text-sm'}`}
        style={{ overflow: 'visible' }}
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 ring-white/80"
          style={{
            background:
              platformId === 'facebook'
                ? '#1877F2'
                : `linear-gradient(135deg, ${grad.start}, ${grad.end})`,
          }}
          title={iconOnly ? meta.name : undefined}
          aria-label={iconOnly ? meta.name : undefined}
        >
          <PlatformIcon platformId={platformId} size={14} className="drop-shadow-sm" />
        </span>
        {axisText ? (
          <span className="whitespace-nowrap leading-none">{axisText}</span>
        ) : null}
      </div>
    </foreignObject>
  )
}

export default function SourceBarChart({ data, platformDeltas }: SourceBarChartProps) {
  const reducedMotion = usePrefersReducedMotion()
  const chartCssVars = usePortalChartCssVars()
  const { ref, labelMode } = useChartLayoutTier()
  const rows = data ?? []

  const deltaByPlatform = useMemo(() => {
    if (!platformDeltas?.length) return null
    return new Map(platformDeltas.map((d) => [d.platformId, d]))
  }, [platformDeltas])

  const chartData: ChartRow[] = useMemo(
    () =>
      rows.map((row) => {
        const platformId = resolvePlatformId(row.platformId)
        return {
          ...row,
          platformId,
          platformLabel: PLATFORM_META[platformId].name,
        }
      }),
    [rows],
  )

  const platformIds = useMemo(
    () => chartData.map((row) => row.platformId),
    [chartData],
  )

  const leftMargin = useMemo(
    () => computeBarChartLeftMargin(labelMode, platformIds),
    [labelMode, platformIds],
  )

  const chartConfig = useMemo(
    () =>
      Object.fromEntries(
        chartData.map((row) => [
          row.platformId,
          { label: row.platformLabel, color: PLATFORM_BAR_GRADIENTS[row.platformId].start },
        ]),
      ),
    [chartData],
  )

  const margin = { top: 12, right: 28, bottom: 36, left: leftMargin }

  const yAxisTick = useMemo(
    () =>
      function Tick(props: Omit<AxisTickProps, 'labelMode' | 'leftMargin'>) {
        return <PlatformYAxisTick {...props} labelMode={labelMode} leftMargin={leftMargin} />
      },
    [labelMode, leftMargin],
  )

  if (!chartData.length) {
    return (
      <p className="py-12 text-center text-sm portal-sl-secondary">
        No platform breakdown available.
      </p>
    )
  }

  return (
    <div ref={ref} className="h-full w-full min-w-0">
      <ChartContainer label="Mentions by platform bar chart" size="md">
        <RechartsChartContainer
          config={chartConfig}
          className="portal-chart-glow h-full w-full [&_.recharts-surface]:overflow-visible [&_.recharts-wrapper]:overflow-visible"
          style={chartCssVars}
        >
          <BarChart data={chartData} layout="vertical" margin={margin}>
            <defs>
              {chartData.map((row) => {
                const g = PLATFORM_BAR_GRADIENTS[row.platformId]
                return (
                  <linearGradient
                    key={row.platformId}
                    id={platformGradientDefId(row.platformId)}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor={g.start} />
                    <stop offset="100%" stopColor={g.end} />
                  </linearGradient>
                )
              })}
            </defs>
            <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
              tickFormatter={(value) => Number(value).toLocaleString()}
            />
            <YAxis
              type="category"
              dataKey="platformId"
              tickLine={false}
              axisLine={false}
              width={leftMargin}
              interval={0}
              tick={yAxisTick}
            />
            <ChartTooltip
              cursor={{ fill: 'var(--chart-grid)', opacity: 0.3 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const row = payload[0].payload as ChartRow
                const platformId = row.platformId
                const meta = PLATFORM_META[platformId]
                const grad = PLATFORM_BAR_GRADIENTS[platformId]
                const delta = deltaByPlatform?.get(platformId)
                return (
                  <GlassChartTooltip accent={grad.glow}>
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg shadow-inner"
                        style={{
                          background:
                            platformId === 'facebook'
                              ? '#1877F2'
                              : `linear-gradient(135deg, ${grad.start}, ${grad.end})`,
                        }}
                      >
                        <PlatformIcon platformId={platformId} size={18} />
                      </span>
                      <div>
                        <strong className="text-chambray">{meta.name}</strong>
                        <div className="portal-sl-secondary">
                          {row.mentions.toLocaleString()} mentions
                        </div>
                        {delta ? (
                          <>
                            <div className="mt-1 text-xs portal-sl-secondary">
                              Baseline: {delta.baseline.toLocaleString()}
                            </div>
                            <div className="text-xs font-medium text-sanmarino">
                              {formatMetricDeltaLine(delta, true)} ·{' '}
                              {formatMetricDeltaLine(delta)}
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </GlassChartTooltip>
                )
              }}
            />
            <Bar
              dataKey="mentions"
              radius={[0, 10, 10, 0]}
              isAnimationActive={!reducedMotion}
            >
              {chartData.map((row) => (
                <Cell key={row.platformId} fill={platformBarFill(row.platformId)} />
              ))}
            </Bar>
          </BarChart>
        </RechartsChartContainer>
      </ChartContainer>
    </div>
  )
}
