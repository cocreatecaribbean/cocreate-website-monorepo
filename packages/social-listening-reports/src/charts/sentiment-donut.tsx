import { Circle, G, Path, Svg, Text, View } from '@react-pdf/renderer'
import type { ReportFormat } from '../page-sizes'
import type { SentimentSlice } from '../types'
import { getChartSizes } from '../chart-sizes'
import { colors, getReportTheme } from '../theme'

const SENTIMENT_COLORS = {
  positive: colors.positive,
  neutral: colors.neutral,
  negative: colors.negative,
} as const

function sentimentColor(id: string): string {
  return SENTIMENT_COLORS[id as keyof typeof SENTIMENT_COLORS] ?? colors.sanmarino
}

export function PdfSentimentDonut({
  slices,
  format = 'letter',
  title,
  subtitle,
  hideLegend = false,
}: {
  slices: SentimentSlice[]
  format?: ReportFormat
  title?: string
  subtitle?: string
  hideLegend?: boolean
}) {
  const theme = getReportTheme(format)
  const sizes = getChartSizes(format)
  const { size, innerRatio } = sizes.donut
  const total = slices.reduce((sum, s) => sum + s.value, 0)

  if (total <= 0) {
    return <Text style={theme.sectionDesc}>No sentiment data available</Text>
  }

  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 8
  const innerR = outerR * innerRatio
  let angle = -Math.PI / 2

  const arcs = slices.map((slice) => {
    const fraction = slice.value / total
    const sweep = fraction * Math.PI * 2
    const x1 = cx + outerR * Math.cos(angle)
    const y1 = cy + outerR * Math.sin(angle)
    const x2 = cx + outerR * Math.cos(angle + sweep)
    const y2 = cy + outerR * Math.sin(angle + sweep)
    const ix1 = cx + innerR * Math.cos(angle + sweep)
    const iy1 = cy + innerR * Math.sin(angle + sweep)
    const ix2 = cx + innerR * Math.cos(angle)
    const iy2 = cy + innerR * Math.sin(angle)
    const large = sweep > Math.PI ? 1 : 0
    const d = [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ')
    angle += sweep
    return <Path key={slice.id} d={d} fill={sentimentColor(slice.id)} />
  })

  const topSlice = [...slices].sort((a, b) => b.value - a.value)[0]
  const topPct = topSlice ? Math.round((topSlice.value / total) * 100) : 0

  return (
    <View>
      {title ? <Text style={theme.chartCardTitle}>{title}</Text> : null}
      {subtitle ? <Text style={theme.chartCardSubtitle}>{subtitle}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: format === 'deck' ? 48 : 24 }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G>{arcs}</G>
          <Circle cx={cx} cy={cy} r={innerR - 2} fill={colors.white} />
          <Text
            x={cx}
            y={cy - (format === 'deck' ? 14 : 8)}
            style={{
              fontSize: format === 'deck' ? 36 : 18,
              fontFamily: theme.heroKpiValue.fontFamily,
              fontWeight: 700,
              textAnchor: 'middle',
              fill: colors.chambray,
            }}
          >
            {total.toLocaleString()}
          </Text>
          <Text
            x={cx}
            y={cy + (format === 'deck' ? 22 : 12)}
            style={{
              fontSize: format === 'deck' ? 16 : 9,
              textAnchor: 'middle',
              fill: colors.slate500,
            }}
          >
            mentions
          </Text>
        </Svg>
        {!hideLegend ? (
          <View style={{ flex: 1 }}>
            {topSlice ? (
              <Text
                style={{
                  fontSize: format === 'deck' ? 22 : 12,
                  fontWeight: 700,
                  color: colors.chambray,
                  marginBottom: format === 'deck' ? 16 : 10,
                }}
              >
                {topPct}% {topSlice.label.toLowerCase()}
              </Text>
            ) : null}
            {slices.map((slice) => (
              <View key={slice.id} style={theme.legendRow}>
                <View
                  style={{ ...theme.legendSwatch, backgroundColor: sentimentColor(slice.id) }}
                />
                <Text style={theme.legendLabel}>{slice.label}</Text>
                <Text style={theme.legendValue}>
                  {slice.value.toLocaleString()} ({Math.round((slice.value / total) * 100)}%)
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  )
}

/** @deprecated Use PdfSentimentDonut */
export const PdfSentimentPie = PdfSentimentDonut
