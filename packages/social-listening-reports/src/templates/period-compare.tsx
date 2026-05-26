import { Document, Page, View } from '@react-pdf/renderer'
import { CoverPage, ReportFooter } from '../components/report-chrome'
import { KpiSection } from '../components/kpi-section'
import { PlatformBars } from '../components/platform-bars'
import type { ReportRenderContext } from '../types'
import { theme } from '../theme'

export function PeriodCompareDocument({ context }: { context: ReportRenderContext }) {
  const { data } = context.snapshot
  const compare = context.compare!

  return (
    <Document title={`${context.organization.name} — Period Comparison`}>
      <Page size="A4">
        <CoverPage
          context={context}
          title="Social Listening"
          subtitle={`Period comparison · ${compare.current.date} vs ${compare.baseline.date}`}
        />
        <ReportFooter context={context} templateLabel="Period Compare" />
      </Page>

      <Page size="A4" style={theme.page}>
        <KpiSection data={data} compare={compare} />
        <View style={{ marginTop: 24 }}>
          <PlatformBars rows={data.sourceBreakdown} />
        </View>
        <ReportFooter context={context} templateLabel="Period Compare" />
      </Page>
    </Document>
  )
}
