import { Text, View } from '@react-pdf/renderer'
import type { ReportFormat } from '../../page-sizes'
import { getReportTheme } from '../../theme'

export function SectionMasthead({
  eyebrow,
  title,
  format = 'letter',
}: {
  eyebrow: string
  title: string
  format?: ReportFormat
}) {
  const styles = getReportTheme(format)
  return (
    <View style={styles.masthead}>
      <Text style={styles.mastheadEyebrow}>{eyebrow}</Text>
      <Text style={styles.mastheadTitle}>{title}</Text>
    </View>
  )
}
