import { Text, View } from '@react-pdf/renderer'
import type { ReportCompareBundle, SocialListeningAnalytics } from '../types'
import type { ReportFormat } from '../page-sizes'
import { HeroKpiStrip } from './layout/hero-kpi-strip'
import { getReportTheme } from '../theme'

export function KpiSection({
  data,
  compare,
  format = 'letter',
}: {
  data: SocialListeningAnalytics
  compare?: ReportCompareBundle
  format?: ReportFormat
}) {
  const theme = getReportTheme(format)

  return (
    <View>
      <Text style={theme.sectionTitle}>Mention summary</Text>
      <Text style={theme.sectionDesc}>
        Aggregated from the saved snapshot for this reporting period.
      </Text>
      <HeroKpiStrip data={data} compare={compare} format={format} />
    </View>
  )
}
