import { G, Line, Rect, Svg, Text, View } from '@react-pdf/renderer'
import type { ReportFormat } from '../page-sizes'
import type { SentimentOverTimeRow } from '../types'
import { chartWidth, getChartSizes } from '../chart-sizes'
import { colors, getReportTheme } from '../theme'

const SERIES = [
  { key: 'positive' as const, label: 'Positive', color: colors.positive },
  { key: 'neutral' as const, label: 'Neutral', color: colors.neutral },
  { key: 'negative' as const, label: 'Negative', color: colors.negative },
]

export function PdfSentimentTrend({
  rows,
  format = 'letter',
  title,
  subtitle,
}: {
  rows: SentimentOverTimeRow[]
  format?: ReportFormat
  title?: string
  subtitle?: string
}) {
  const theme = getReportTheme(format)
  const sizes = getChartSizes(format)
  const width = chartWidth(format)
  const height = sizes.trendHeight
  const slice = rows.slice(-10)

  if (slice.length === 0) {
    return <Text style={theme.sectionDesc}>No sentiment trend data</Text>
  }

  const padding = { top: 12, right: 12, bottom: 40, left: 44 }
  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom
  const barGroupW = plotW / slice.length
  const barW = Math.min(format === 'deck' ? 36 : 14, barGroupW * 0.22)
  const gap = barW * 0.15

  const maxTotal = Math.max(
    ...slice.map((r) => r.positive + r.neutral + r.negative),
    1,
  )

  const fontSize = format === 'deck' ? 14 : 9

  return (
    <View>
      {title ? <Text style={theme.chartCardTitle}>{title}</Text> : null}
      {subtitle ? <Text style={theme.chartCardSubtitle}>{subtitle}</Text> : null}
      <View
        style={{
          flexDirection: 'row',
          marginBottom: format === 'deck' ? 16 : 10,
          gap: format === 'deck' ? 20 : 12,
        }}
      >
        {SERIES.map((s) => (
          <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: format === 'deck' ? 14 : 8,
                height: format === 'deck' ? 14 : 8,
                backgroundColor: s.color,
                borderRadius: 2,
                marginRight: 6,
              }}
            />
            <Text style={{ fontSize, color: colors.slate600 }}>{s.label}</Text>
          </View>
        ))}
      </View>
      <Svg width={width} height={height}>
        <Line
          x1={padding.left}
          y1={padding.top + plotH}
          x2={padding.left + plotW}
          y2={padding.top + plotH}
          stroke={colors.slate200}
          strokeWidth={1}
        />
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const y = padding.top + plotH - frac * plotH
          const val = Math.round(maxTotal * frac)
          return (
            <G key={`y-${i}`}>
              <Line
                x1={padding.left}
                y1={y}
                x2={padding.left + plotW}
                y2={y}
                stroke={colors.slate200}
                strokeWidth={0.5}
              />
              <Text
                x={padding.left - 6}
                y={y + 4}
                style={{ fontSize, fill: colors.slate500, textAnchor: 'end' }}
              >
                {val}
              </Text>
            </G>
          )
        })}
        {slice.map((row, i) => {
          const groupX = padding.left + i * barGroupW + barGroupW / 2
          let stackY = padding.top + plotH
          const segments = SERIES.map((s) => ({
            ...s,
            value: row[s.key],
          }))
          return (
            <G key={row.date}>
              {segments.map((seg, segIndex) => {
                const h = (seg.value / maxTotal) * plotH
                stackY -= h
                const x =
                  groupX -
                  (barW * 3 + gap * 2) / 2 +
                  segIndex * (barW + gap)
                return (
                  <Rect
                    key={seg.key}
                    x={x}
                    y={stackY}
                    width={barW}
                    height={Math.max(h, 0)}
                    fill={seg.color}
                    rx={2}
                  />
                )
              })}
              {(i === 0 || i === slice.length - 1 || i % 2 === 0) && (
                <Text
                  x={groupX}
                  y={padding.top + plotH + (format === 'deck' ? 24 : 16)}
                  style={{ fontSize, fill: colors.slate500, textAnchor: 'middle' }}
                >
                  {row.date.slice(5)}
                </Text>
              )}
            </G>
          )
        })}
      </Svg>
    </View>
  )
}
