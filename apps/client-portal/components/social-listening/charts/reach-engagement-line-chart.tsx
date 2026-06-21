'use client'

import { ResponsiveLine } from '@nivo/line'
import ChartContainer from '@client-portal/components/social-listening/chart-container'
import GlassChartTooltip from '@client-portal/components/social-listening/glass-tooltip'
import { brandColors, lineSeriesColors } from '@client-portal/components/social-listening/nivo-theme'
import { useNivoTheme } from '@client-portal/components/social-listening/use-nivo-theme'
import { useIsMobileChart } from '@client-portal/components/social-listening/use-is-mobile-chart'
import { usePrefersReducedMotion } from '@client-portal/components/social-listening/use-prefers-reduced-motion'
import type { ReachEngagementSeries } from '@client-portal/lib/social-listening/types'

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
  const nivoTheme = useNivoTheme()
  const isMobile = useIsMobileChart()

  const margin = isMobile
    ? { top: 16, right: 16, bottom: 72, left: 40 }
    : { top: 24, right: 28, bottom: 64, left: 48 }

  const legends = isMobile
    ? [
        {
          anchor: 'bottom' as const,
          direction: 'column' as const,
          align: 'center' as const,
          translateX: 0,
          translateY: 56,
          itemWidth: 200,
          itemHeight: 22,
          itemsSpacing: 6,
          symbolSize: 12,
          symbolShape: 'circle' as const,
        },
      ]
    : [
        {
          anchor: 'bottom' as const,
          direction: 'row' as const,
          justify: false,
          translateX: 0,
          translateY: 52,
          itemWidth: 175,
          itemHeight: 22,
          itemsSpacing: 32,
          symbolSize: 12,
          symbolShape: 'circle' as const,
        },
      ]

  return (
    <ChartContainer
      label="Reach versus engagement line chart"
      minHeight="min-h-[260px] sm:min-h-[300px]"
    >
      <ResponsiveLine
        data={data}
        margin={margin}
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
        legends={legends}
        tooltip={({ point }) => (
          <GlassChartTooltip
            accent={
              point.serieId === 'Reach (k)'
                ? 'rgba(57, 65, 154, 0.25)'
                : 'rgba(246, 176, 63, 0.35)'
            }
          >
            <strong className="text-chambray">{point.serieId}</strong>
            <div className="portal-sl-secondary">
              {point.data.xFormatted}: {point.data.yFormatted}
            </div>
          </GlassChartTooltip>
        )}
      />
    </ChartContainer>
  )
}
