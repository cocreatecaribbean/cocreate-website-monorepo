import { Text, View } from '@react-pdf/renderer'
import type { ReportFormat } from '../../page-sizes'
import { getReportTheme } from '../../theme'

export function InsightCallout({
  headline,
  detail,
  format = 'letter',
}: {
  headline: string
  detail: string
  format?: ReportFormat
}) {
  const styles = getReportTheme(format)
  return (
    <View style={styles.callout}>
      <Text style={styles.calloutHeadline}>{headline}</Text>
      <Text style={styles.calloutDetail}>{detail}</Text>
    </View>
  )
}
