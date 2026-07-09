import { Text, View } from '@react-pdf/renderer'
import type { ReportFormat } from '../../page-sizes'
import { getReportTheme } from '../../theme'

export function InteriorPageHeader({
  organizationName,
  sectionLabel,
  format = 'letter',
}: {
  organizationName: string
  sectionLabel: string
  format?: ReportFormat
}) {
  const styles = getReportTheme(format)
  return (
    <View style={styles.interiorHeader}>
      <Text style={styles.interiorHeaderOrg}>{organizationName}</Text>
      <Text style={styles.interiorHeaderSection}>{sectionLabel}</Text>
    </View>
  )
}
