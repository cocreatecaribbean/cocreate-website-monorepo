'use client'

import { useMemo } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import ChartContainer from '../chart-container'
import GlassChartTooltip from '../glass-tooltip'
import PlatformIcon from '../platform-icon'
import { useNivoTheme } from '../hooks/use-nivo-theme'
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion'
import {
  PLATFORM_BAR_GRADIENTS,
  platformGradientDefId,
} from '@cocreate/social-listening/core'
import {
  PLATFORM_META,
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

const LEFT_MARGIN = 152

export default function SourceBarChart({ data, platformDeltas }: SourceBarChartProps) {
  const reducedMotion = usePrefersReducedMotion()
  const nivoTheme = useNivoTheme()
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

  if (!chartData.length) {
    return (
      <p className="py-12 text-center text-sm portal-sl-secondary">
        No platform breakdown available.
      </p>
    )
  }

  return (
    <ChartContainer
      label="Mentions by platform bar chart"
      minHeight="min-h-[300px] sm:min-h-[340px]"
      className="portal-chart-glow"
    >
      <div className="absolute inset-0">
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
                        background:
                          platformId === 'facebook'
                            ? '#1877F2'
                            : `linear-gradient(135deg, ${grad.start}, ${grad.end})`,
                      }}
                    >
                      <PlatformIcon
                        platformId={platformId}
                        size={14}
                        className="drop-shadow-sm"
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
                    {Number(value).toLocaleString()} mentions
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
      </div>
    </ChartContainer>
  )
}
