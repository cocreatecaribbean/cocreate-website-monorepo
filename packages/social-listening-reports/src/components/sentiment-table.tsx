import { Text, View } from '@react-pdf/renderer'
import type { SentimentOverTimeRow } from '../types'
import { theme } from '../theme'

export function SentimentOverTimeTable({ rows }: { rows: SentimentOverTimeRow[] }) {
  const slice = rows.slice(-10)

  return (
    <View>
      <Text style={theme.sectionTitle}>Sentiment over time</Text>
      <Text style={theme.sectionDesc}>Daily mention volume by sentiment (recent days).</Text>
      <View style={theme.tableHeader}>
        <Text style={[theme.cellBold, { width: '28%' }]}>Date</Text>
        <Text style={[theme.cellBold, { width: '24%' }]}>Positive</Text>
        <Text style={[theme.cellBold, { width: '24%' }]}>Neutral</Text>
        <Text style={[theme.cellBold, { width: '24%' }]}>Negative</Text>
      </View>
      {slice.map((row) => (
        <View key={row.date} style={theme.tableRow}>
          <Text style={[theme.cell, { width: '28%' }]}>{row.date}</Text>
          <Text style={[theme.cell, { width: '24%' }]}>{row.positive}</Text>
          <Text style={[theme.cell, { width: '24%' }]}>{row.neutral}</Text>
          <Text style={[theme.cell, { width: '24%' }]}>{row.negative}</Text>
        </View>
      ))}
    </View>
  )
}
