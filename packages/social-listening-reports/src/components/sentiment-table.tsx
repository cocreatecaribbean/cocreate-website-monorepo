import { formatSentimentStreamLabel } from '@cocreate/social-listening/core'
import { Text, View } from '@react-pdf/renderer'
import type { ReportFormat } from '../page-sizes'
import type { SentimentOverTimeRow } from '../types'
import { getReportTheme } from '../theme'

export function SentimentOverTimeTable({
  rows,
  format = 'letter',
  compact = false,
  periodStart,
  periodEnd,
}: {
  rows: SentimentOverTimeRow[]
  format?: ReportFormat
  compact?: boolean
  periodStart?: string
  periodEnd?: string
}) {
  const theme = getReportTheme(format)
  const slice = rows.slice(compact ? -5 : -10)
  const period =
    periodStart && periodEnd
      ? {
          periodStart: periodStart.slice(0, 10),
          periodEnd: periodEnd.slice(0, 10),
        }
      : null

  return (
    <View>
      <Text style={theme.sectionTitle}>Weekly sentiment detail</Text>
      <Text style={theme.sectionDesc}>
        Mention volume by sentiment for each week in this monthly period.
      </Text>
      <View style={theme.tableHeader}>
        <Text style={[theme.cellBold, { width: '28%' }]}>Week</Text>
        <Text style={[theme.cellBold, { width: '24%' }]}>Positive</Text>
        <Text style={[theme.cellBold, { width: '24%' }]}>Neutral</Text>
        <Text style={[theme.cellBold, { width: '24%' }]}>Negative</Text>
      </View>
      {slice.map((row) => (
        <View key={row.date} style={theme.tableRow}>
          <Text style={[theme.cell, { width: '28%' }]}>
            {period ? formatSentimentStreamLabel(row, period) : row.date}
          </Text>
          <Text style={[theme.cell, { width: '24%' }]}>{row.positive}</Text>
          <Text style={[theme.cell, { width: '24%' }]}>{row.neutral}</Text>
          <Text style={[theme.cell, { width: '24%' }]}>{row.negative}</Text>
        </View>
      ))}
    </View>
  )
}
