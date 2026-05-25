'use client'

import { ResponsiveLine } from '@nivo/line'
import ChartContainer from '@/components/social-listening/chart-container'
import GlassChartTooltip from '@/components/social-listening/glass-tooltip'
import { brandColors, lineSeriesColors, nivoTheme } from '@/components/social-listening/nivo-theme'
import { usePrefersReducedMotion } from '@/components/social-listening/use-prefers-reduced-motion'
import type { ReachEngagementSeries } from '@/lib/social-listening/types'

type ReachEngagementLineChartProps = {
  data: ReachEngagementSeries[]
}

const lineDefs = [
  {
    id: 'grad-reach',
    type: 'linearGradient' as const,
    colors: [
      { offset: 0, color: brandColors.chambray, opacity: 0.35 },
      { offset: 100, color: brandColors.chambray, opacity: 0 },
    ],
  },
  {
    id: 'grad-engage',
    type: 'linearGradient' as const,
    colors: [
      { offset: 0, color: brandColors.casablanca, opacity: 0.4 },
      { offset: 100, color: brandColors.casablanca, opacity: 0 },
    ],
  },
]

export default function ReachEngagementLineChart({ data }: ReachEngagementLineChartProps) {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <ChartContainer
      label="Reach versus engagement line chart"
      minHeight="min-h-[260px] sm:min-h-[300px]"
    >
      <ResponsiveLine
        data={data}
        margin={{ top: 24, right: 120, bottom: 48, left: 48 }}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', stacked: false }}
        curve="monotoneX"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
        }}
        enableGridX={false}
        enableGridY
        colors={lineSeriesColors}
        lineWidth={3}
        pointSize={10}
        pointBorderWidth={2}
        pointBorderColor="#ffffff"
        useMesh
        enableArea
        areaOpacity={0.18}
        defs={lineDefs}
        fill={[
          { match: { id: 'Social Reach (Thousands)' }, id: 'grad-reach' },
          { match: { id: 'Engagement Volume' }, id: 'grad-engage' },
        ]}
        theme={nivoTheme}
        animate={!reducedMotion}
        motionConfig={reducedMotion ? 'none' : 'gentle'}
        legends={[
          {
            anchor: 'top-right',
            direction: 'column',
            translateX: 110,
            itemWidth: 100,
            itemHeight: 20,
            symbolSize: 12,
            symbolShape: 'circle',
          },
        ]}
        tooltip={({ point }) => (
          <GlassChartTooltip
            accent={
              point.serieId === 'Reach (k)'
                ? 'rgba(57, 65, 154, 0.25)'
                : 'rgba(246, 176, 63, 0.35)'
            }
          >
            <strong className="text-chambray">{point.serieId}</strong>
            <div className="text-slate-600">
              {point.data.xFormatted}: {point.data.yFormatted}
            </div>
          </GlassChartTooltip>
        )}
      />
    </ChartContainer>
  )
}
