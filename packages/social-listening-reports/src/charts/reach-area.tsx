import { Circle, G, Line, Path, Svg, Text, View } from '@react-pdf/renderer'
import type { ReportFormat } from '../page-sizes'
import { chartWidth, getChartSizes } from '../chart-sizes'
import { colors, getReportTheme } from '../theme'

export function PdfReachArea({
  points,
  format = 'letter',
  title,
  subtitle,
  seriesLabel = 'Reach',
}: {
  points: { x: string; y: number }[]
  format?: ReportFormat
  title?: string
  subtitle?: string
  seriesLabel?: string
}) {
  const theme = getReportTheme(format)
  const sizes = getChartSizes(format)
  const width = chartWidth(format)
  const height = sizes.reachHeight

  if (points.length < 2) {
    return <Text style={theme.sectionDesc}>Insufficient reach data</Text>
  }

  const padding = { top: 16, right: 16, bottom: 36, left: 48 }
  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom
  const maxY = Math.max(...points.map((p) => p.y), 1)
  const minY = 0
  const step = plotW / (points.length - 1)

  const coords = points.map((p, i) => ({
    x: padding.left + i * step,
    y: padding.top + plotH - ((p.y - minY) / (maxY - minY)) * plotH,
    label: p.x,
    value: p.y,
  }))

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
  const areaPath = [
    linePath,
    `L ${coords[coords.length - 1]!.x} ${padding.top + plotH}`,
    `L ${coords[0]!.x} ${padding.top + plotH}`,
    'Z',
  ].join(' ')

  const gridLines = 4
  const yLabels: number[] = []
  for (let i = 0; i <= gridLines; i++) {
    yLabels.push(minY + ((maxY - minY) * i) / gridLines)
  }

  const fontSize = format === 'deck' ? 14 : 9

  return (
    <View>
      {title ? <Text style={theme.chartCardTitle}>{title}</Text> : null}
      {subtitle ? <Text style={theme.chartCardSubtitle}>{subtitle}</Text> : null}
      <Text
        style={{
          fontSize: format === 'deck' ? 16 : 10,
          color: colors.sanmarino,
          marginBottom: 8,
          fontWeight: 600,
        }}
      >
        {seriesLabel}
      </Text>
      <Svg width={width} height={height}>
        {yLabels.map((val, i) => {
          const y = padding.top + plotH - (i / gridLines) * plotH
          return (
            <G key={`grid-${i}`}>
              <Line
                x1={padding.left}
                y1={y}
                x2={padding.left + plotW}
                y2={y}
                stroke={colors.slate200}
                strokeWidth={1}
              />
              <Text
                x={padding.left - 8}
                y={y + 4}
                style={{ fontSize, fill: colors.slate500, textAnchor: 'end' }}
              >
                {Math.round(val).toLocaleString()}
              </Text>
            </G>
          )
        })}
        <Path d={areaPath} fill="rgba(64, 110, 181, 0.18)" />
        <Path d={linePath} stroke={colors.chambray} strokeWidth={format === 'deck' ? 3 : 2} fill="none" />
        {coords.map((c, i) => (
          <G key={`pt-${i}`}>
            <Circle cx={c.x} cy={c.y} r={format === 'deck' ? 5 : 3} fill={colors.sanmarino} />
            {(i === 0 || i === coords.length - 1 || i % 2 === 0) && (
              <Text
                x={c.x}
                y={padding.top + plotH + (format === 'deck' ? 22 : 16)}
                style={{ fontSize, fill: colors.slate500, textAnchor: 'middle' }}
              >
                {c.label.length > 8 ? c.label.slice(5) : c.label}
              </Text>
            )}
          </G>
        ))}
      </Svg>
    </View>
  )
}

/** @deprecated Use PdfReachArea */
export const PdfReachLine = PdfReachArea
