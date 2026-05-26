import { Text, View } from '@react-pdf/renderer'
import type { ReportCompareBundle, SocialListeningAnalytics } from '../types'
import { colors, theme } from '../theme'

function formatDelta(change: number, percent: number | null): string {
  const sign = change > 0 ? '+' : ''
  if (percent !== null) return `${sign}${percent.toFixed(1)}% vs baseline`
  return `${sign}${change.toLocaleString()} vs baseline`
}

export function KpiSection({
  data,
  compare,
}: {
  data: SocialListeningAnalytics
  compare?: ReportCompareBundle
}) {
  const total = data.sentimentSummary.reduce((s, row) => s + row.value, 0)
  const positive = data.sentimentSummary.find((s) => s.id === 'positive')?.value ?? 0
  const negative = data.sentimentSummary.find((s) => s.id === 'negative')?.value ?? 0
  const neutral = data.sentimentSummary.find((s) => s.id === 'neutral')?.value ?? 0

  const pct = (n: number) => (total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '0%')

  const items = [
    {
      label: 'Total mentions',
      value: total.toLocaleString(),
      sub: 'Across all tracked sources',
      delta: compare?.deltas.totalMentions,
    },
    {
      label: 'Positive',
      value: pct(positive),
      sub: `${positive.toLocaleString()} mentions`,
      delta: compare?.deltas.positive,
      color: colors.positive,
    },
    {
      label: 'Negative',
      value: pct(negative),
      sub: `${negative.toLocaleString()} mentions`,
      delta: compare?.deltas.negative,
      color: colors.negative,
    },
    {
      label: 'Neutral',
      value: pct(neutral),
      sub: `${neutral.toLocaleString()} mentions`,
      delta: compare?.deltas.neutral,
      color: colors.neutral,
    },
  ]

  return (
    <View>
      <Text style={theme.sectionTitle}>Mention summary</Text>
      <Text style={theme.sectionDesc}>
        Aggregated from the saved snapshot for this reporting period.
      </Text>
      <View style={theme.kpiGrid}>
        {items.map((item) => (
          <View key={item.label} style={theme.kpiCard}>
            <Text style={theme.kpiLabel}>{item.label}</Text>
            <Text
              style={
                item.color
                  ? { ...theme.kpiValue, color: item.color }
                  : theme.kpiValue
              }
            >
              {item.value}
            </Text>
            <Text style={theme.kpiSub}>{item.sub}</Text>
            {item.delta ? (
              <Text
                style={{
                  ...theme.kpiSub,
                  color: colors.sanmarino,
                  marginTop: 4,
                }}
              >
                {formatDelta(item.delta.change, item.delta.percentChange)}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  )
}
