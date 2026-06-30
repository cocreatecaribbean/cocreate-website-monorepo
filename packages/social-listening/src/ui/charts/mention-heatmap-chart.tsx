'use client'

import { ResponsiveHeatMap } from '@nivo/heatmap'
import ChartContainer from '../chart-container'
import GlassChartTooltip from '../glass-tooltip'
import { heatmapBrandScale } from '../nivo-theme'
import { useNivoTheme } from '../hooks/use-nivo-theme'
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion'
import type { MentionMatrixRow } from '@cocreate/social-listening/core'

type MentionHeatmapChartProps = {
  data: MentionMatrixRow[]
}

function heatmapCellColor(value: number, max: number): string {
  if (max <= 0) return heatmapBrandScale[0]
  const t = Math.min(1, Math.max(0, value / max))
  const idx = Math.min(
    heatmapBrandScale.length - 1,
    Math.floor(t * (heatmapBrandScale.length - 1)),
  )
  return heatmapBrandScale[idx] ?? heatmapBrandScale[0]
}

export default function MentionHeatmapChart({ data }: MentionHeatmapChartProps) {
  const reducedMotion = usePrefersReducedMotion()
  const nivoTheme = useNivoTheme()
  const maxVal = Math.max(...data.flatMap((row) => row.data.map((cell) => cell.y)), 1)

  return (
    <ChartContainer
      label="Mention volume by day and time heatmap"
      minHeight="min-h-[280px] sm:min-h-[320px]"
    >
      <ResponsiveHeatMap
        data={data}
        margin={{ top: 48, right: 24, bottom: 48, left: 72 }}
        valueFormat=">-.0f"
        axisTop={{
          tickSize: 0,
          tickPadding: 8,
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
        }}
        axisRight={null}
        axisBottom={null}
        colors={(cell) => heatmapCellColor(cell.value ?? 0, maxVal)}
        emptyColor="rgba(255,255,255,0.5)"
        borderWidth={2}
        borderColor="rgba(255,255,255,0.85)"
        theme={nivoTheme}
        animate={!reducedMotion}
        motionConfig={reducedMotion ? 'none' : 'gentle'}
        labelTextColor={{
          from: 'color',
          modifiers: [['darker', 2.2]],
        }}
        hoverTarget="cell"
        legends={[
          {
            anchor: 'bottom',
            translateY: 40,
            length: 200,
            thickness: 12,
            direction: 'row',
            tickPosition: 'after',
            tickSize: 3,
            tickSpacing: 6,
            tickOverlap: false,
            title: 'Mentions →',
            titleAlign: 'start',
            titleOffset: 4,
          },
        ]}
        tooltip={({ cell }) => (
          <GlassChartTooltip accent="rgba(64, 110, 181, 0.3)">
            <strong className="text-chambray">{cell.serieId}</strong>
            <div className="portal-sl-secondary">
              {cell.data.x}: {cell.formattedValue} mentions
            </div>
          </GlassChartTooltip>
        )}
      />
    </ChartContainer>
  )
}
