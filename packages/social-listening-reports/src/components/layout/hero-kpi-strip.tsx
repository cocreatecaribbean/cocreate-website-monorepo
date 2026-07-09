import { Text, View } from '@react-pdf/renderer'
import type { ReportCompareBundle, SocialListeningAnalytics } from '../../types'
import type { ReportFormat } from '../../page-sizes'
import { colors, getReportTheme } from '../../theme'

function formatDelta(change: number, percent: number | null): string {
  const sign = change > 0 ? '+' : ''
  if (percent !== null) return `${sign}${percent.toFixed(1)}% vs baseline`
  return `${sign}${change.toLocaleString()} vs baseline`
}

export function HeroKpiStrip({
  data,
  compare,
  format = 'letter',
}: {
  data: SocialListeningAnalytics
  compare?: ReportCompareBundle
  format?: ReportFormat
}) {
  const styles = getReportTheme(format)
  const total = data.sentimentSummary.reduce((s, row) => s + row.value, 0)
  const positive = data.sentimentSummary.find((s) => s.id === 'positive')?.value ?? 0
  const negative = data.sentimentSummary.find((s) => s.id === 'negative')?.value ?? 0
  const neutral = data.sentimentSummary.find((s) => s.id === 'neutral')?.value ?? 0
  const pct = (n: number) => (total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '0%')

  const items = [
    {
      label: 'Total mentions',
      value: total.toLocaleString(),
      sub: 'All sources',
      delta: compare?.deltas.totalMentions,
      color: colors.chambray,
    },
    {
      label: 'Positive',
      value: pct(positive),
      sub: positive.toLocaleString(),
      delta: compare?.deltas.positive,
      color: colors.positive,
    },
    {
      label: 'Negative',
      value: pct(negative),
      sub: negative.toLocaleString(),
      delta: compare?.deltas.negative,
      color: colors.negative,
    },
    {
      label: 'Neutral',
      value: pct(neutral),
      sub: neutral.toLocaleString(),
      delta: compare?.deltas.neutral,
      color: colors.neutral,
    },
  ]

  return (
    <View style={styles.heroKpiStrip}>
      {items.map((item) => (
        <View key={item.label} style={styles.heroKpiItem}>
          <Text style={styles.heroKpiLabel}>{item.label}</Text>
          <Text style={{ ...styles.heroKpiValue, color: item.color }}>{item.value}</Text>
          <Text style={styles.heroKpiSub}>{item.sub}</Text>
          {item.delta ? (
            <Text
              style={{
                ...styles.heroKpiDelta,
                color: item.delta.change >= 0 ? colors.positive : colors.negative,
              }}
            >
              {formatDelta(item.delta.change, item.delta.percentChange)}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  )
}
