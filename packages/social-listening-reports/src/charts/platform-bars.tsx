import { G, Path, Svg, Text, View } from '@react-pdf/renderer'
import type { ReportFormat } from '../page-sizes'
import type { SourceBreakdownRow } from '../types'
import { platformLabel } from '../platform-labels'
import { chartWidth, getChartSizes } from '../chart-sizes'
import { colors, getReportTheme } from '../theme'

const BAR_COLORS = [colors.chambray, colors.sanmarino, colors.casablanca, '#6b8fd4', '#8fa8dc']

export function PdfPlatformBars({
  rows,
  format = 'letter',
  title,
  subtitle,
}: {
  rows: SourceBreakdownRow[]
  format?: ReportFormat
  title?: string
  subtitle?: string
}) {
  const theme = getReportTheme(format)
  const sizes = getChartSizes(format)
  const width = chartWidth(format)
  const sorted = [...rows].sort((a, b) => b.mentions - a.mentions).slice(0, 8)
  const max = Math.max(...sorted.map((r) => r.mentions), 1)

  const labelCol = format === 'deck' ? 200 : 110
  const valueCol = format === 'deck' ? 90 : 56
  const barArea = width - labelCol - valueCol - 16
  const rowHeight = sizes.barHeight + sizes.barGap
  const svgHeight = sorted.length * rowHeight + 8
  const fontSize = format === 'deck' ? 16 : 10

  if (sorted.length === 0) {
    return <Text style={theme.sectionDesc}>No platform data available</Text>
  }

  return (
    <View>
      {title ? <Text style={theme.chartCardTitle}>{title}</Text> : null}
      {subtitle ? <Text style={theme.chartCardSubtitle}>{subtitle}</Text> : null}
      <Svg width={width} height={svgHeight}>
        {sorted.map((row, i) => {
          const barW = Math.max(12, (row.mentions / max) * barArea)
          const y = i * rowHeight + 4
          const fill = BAR_COLORS[i] ?? colors.sanmarino
          return (
            <G key={row.platformId}>
              <Text
                x={0}
                y={y + sizes.barHeight - 4}
                style={{ fontSize, fill: colors.chambray }}
              >
                {platformLabel(row.platformId)}
              </Text>
              <Path
                d={`M ${labelCol} ${y} h ${barW} v ${sizes.barHeight} h ${-barW} Z`}
                fill={fill}
              />
              <Text
                x={labelCol + barArea + 12}
                y={y + sizes.barHeight - 4}
                style={{
                  fontSize,
                  fontWeight: 600,
                  fill: colors.slate600,
                }}
              >
                {row.mentions.toLocaleString()}
              </Text>
            </G>
          )
        })}
      </Svg>
    </View>
  )
}
