import { Text, View } from '@react-pdf/renderer'
import type { ReportFormat } from '../../page-sizes'
import { getReportTheme } from '../../theme'

export function SectionHeader({
  title,
  description,
  format = 'letter',
}: {
  title: string
  description?: string
  format?: ReportFormat
}) {
  const styles = getReportTheme(format)
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {description ? <Text style={styles.sectionDesc}>{description}</Text> : null}
    </View>
  )
}
