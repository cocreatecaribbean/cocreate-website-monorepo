import { Document, Page, View } from '@react-pdf/renderer'
import { CoverPage, ReportFooter } from '../components/report-chrome'
import { KpiSection } from '../components/kpi-section'
import { PlatformBars } from '../components/platform-bars'
import type { ReportRenderContext } from '../types'
import { theme } from '../theme'

export function ExecutiveSummaryDocument({ context }: { context: ReportRenderContext }) {
  const { data } = context.snapshot

  return (
    <Document title={`${context.organization.name} — Executive Summary`}>
      <Page size="A4">
        <CoverPage
          context={context}
          title="Social Listening"
          subtitle="Executive summary"
        />
        <ReportFooter context={context} templateLabel="Executive Summary" />
      </Page>

      <Page size="A4" style={theme.page}>
        <KpiSection data={data} compare={context.compare} />
        <View style={{ marginTop: 24 }}>
          <PlatformBars rows={data.sourceBreakdown} />
        </View>
        <ReportFooter context={context} templateLabel="Executive Summary" />
      </Page>
    </Document>
  )
}
