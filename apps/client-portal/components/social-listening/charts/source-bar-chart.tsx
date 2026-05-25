'use client'

import { useMemo } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import ChartContainer from '@/components/social-listening/chart-container'
import GlassChartTooltip from '@/components/social-listening/glass-tooltip'
import PlatformIcon from '@/components/social-listening/platform-icon'
import { nivoTheme } from '@/components/social-listening/nivo-theme'
import { usePrefersReducedMotion } from '@/components/social-listening/use-prefers-reduced-motion'
import {
  PLATFORM_BAR_GRADIENTS,
  platformGradientDefId,
} from '@/lib/social-listening/platform-bar-styles'
import {
  PLATFORM_META,
  type SocialPlatformId,
} from '@/lib/social-listening/platform-meta'
import type { SourceBreakdownRow } from '@/lib/social-listening/types'

type ChartRow = SourceBreakdownRow & {
  platformLabel: string
}

type SourceBarChartProps = {
  data: SourceBreakdownRow[]
}

const LEFT_MARGIN = 152

export default function SourceBarChart({ data }: SourceBarChartProps) {
  const reducedMotion = usePrefersReducedMotion()

  const chartData: ChartRow[] = useMemo(
    () =>
      data.map((row) => ({
        ...row,
        platformLabel: PLATFORM_META[row.platformId].name,
      })),
    [data],
  )

  const defs = useMemo(
    () =>
      chartData.map((row) => {
        const g = PLATFORM_BAR_GRADIENTS[row.platformId]
        return {
          id: platformGradientDefId(row.platformId),
          type: 'linearGradient' as const,
          colors: [
            { offset: 0, color: g.start },
            { offset: 100, color: g.end },
          ],
        }
      }),
    [chartData],
  )

  const fill = useMemo(
    () =>
      chartData.map((row) => ({
        match: { id: row.platformId },
        id: platformGradientDefId(row.platformId),
      })),
    [chartData],
  )

  const margin = { top: 12, right: 28, bottom: 36, left: LEFT_MARGIN }

  return (
    <ChartContainer
      label="Mentions by platform bar chart"
      minHeight="min-h-[300px] sm:min-h-[340px]"
      className="portal-chart-glow"
    >
      <ResponsiveBar
        data={chartData}
        keys={['mentions']}
        indexBy="platformId"
        layout="horizontal"
        margin={margin}
        padding={0.32}
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        defs={defs}
        fill={fill}
        borderRadius={10}
        borderWidth={0}
        theme={nivoTheme}
        animate={!reducedMotion}
        motionConfig={reducedMotion ? 'none' : 'wobbly'}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
          format: (v) => Number(v).toLocaleString(),
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 0,
          renderTick: (tick) => {
            const platformId = String(tick.value) as SocialPlatformId
            const meta = PLATFORM_META[platformId]
            const grad = PLATFORM_BAR_GRADIENTS[platformId]
            return (
              <g transform={`translate(${tick.x - LEFT_MARGIN + 6}, ${tick.y - 12})`}>
                <foreignObject width={LEFT_MARGIN - 10} height={24}>
                  <div className="flex h-6 items-center gap-2 text-sm font-medium text-chambray">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-md ring-1 ring-white/80"
                      style={{
                        background: `linear-gradient(135deg, ${grad.start}, ${grad.end})`,
                      }}
                    >
                      <PlatformIcon
                        platformId={platformId}
                        size={14}
                        className="text-white drop-shadow-sm"
                      />
                    </span>
                    <span className="truncate">{meta.name}</span>
                  </div>
                </foreignObject>
              </g>
            )
          },
        }}
        enableLabel={false}
        enableGridX
        enableGridY={false}
        role="application"
        ariaLabel="Mentions by platform"
        tooltip={({ indexValue, value }) => {
          const platformId = indexValue as SocialPlatformId
          const meta = PLATFORM_META[platformId]
          const grad = PLATFORM_BAR_GRADIENTS[platformId]
          return (
            <GlassChartTooltip accent={grad.glow}>
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg shadow-inner"
                  style={{
                    background: `linear-gradient(135deg, ${grad.start}, ${grad.end})`,
                  }}
                >
                  <PlatformIcon platformId={platformId} size={18} className="text-white" />
                </span>
                <div>
                  <strong className="text-chambray">{meta.name}</strong>
                  <div className="text-slate-600">
                    {Number(value).toLocaleString()} mentions
                  </div>
                </div>
              </div>
            </GlassChartTooltip>
          )
        }}
        layers={[
          'grid',
          'axes',
          'bars',
          'markers',
          'legends',
          'annotations',
          ({ bars }) => (
            <g>
              {bars.map((bar) => (
                <rect
                  key={bar.key}
                  x={bar.x + bar.width - 2}
                  y={bar.y}
                  width={3}
                  height={bar.height}
                  rx={2}
                  fill="rgba(255,255,255,0.55)"
                  style={{ pointerEvents: 'none' }}
                />
              ))}
            </g>
          ),
        ]}
      />
    </ChartContainer>
  )
}
