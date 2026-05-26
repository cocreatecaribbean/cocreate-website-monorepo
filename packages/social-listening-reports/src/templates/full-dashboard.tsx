import { Document, Page, Text, View } from '@react-pdf/renderer'
import { CoverPage, ReportFooter } from '../components/report-chrome'
import { KpiSection } from '../components/kpi-section'
import { PlatformBars } from '../components/platform-bars'
import { SentimentOverTimeTable } from '../components/sentiment-table'
import type { ReportRenderContext } from '../types'
import { theme } from '../theme'

export function FullDashboardDocument({ context }: { context: ReportRenderContext }) {
  const { data } = context.snapshot

  return (
    <Document title={`${context.organization.name} — Full Dashboard`}>
      <Page size="A4">
        <CoverPage
          context={context}
          title="Social Listening"
          subtitle="Full dashboard report"
        />
        <ReportFooter context={context} templateLabel="Full Dashboard" />
      </Page>

      <Page size="A4" style={theme.page}>
        <KpiSection data={data} compare={context.compare} />
        <ReportFooter context={context} templateLabel="Full Dashboard" />
      </Page>

      <Page size="A4" style={theme.page}>
        <PlatformBars rows={data.sourceBreakdown} />
        <View style={{ marginTop: 24 }}>
          <SentimentOverTimeTable rows={data.sentimentOverTime} />
        </View>
        <ReportFooter context={context} templateLabel="Full Dashboard" />
      </Page>

      <Page size="A4" style={theme.page}>
        <Text style={theme.sectionTitle}>Reach & engagement</Text>
        <Text style={theme.sectionDesc}>
          Weekly reach (thousands) and engagement volume from the snapshot period.
        </Text>
        {data.reachVsEngagement.map((series) => (
          <View key={series.id} style={{ marginBottom: 16 }}>
            <Text style={[theme.kpiLabel, { marginBottom: 8 }]}>{series.id}</Text>
            {series.data.slice(0, 7).map((point) => (
              <View key={`${series.id}-${point.x}`} style={theme.tableRow}>
                <Text style={[theme.cell, { width: '40%' }]}>{point.x}</Text>
                <Text style={[theme.cellBold, { width: '60%' }]}>
                  {point.y.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        ))}
        <ReportFooter context={context} templateLabel="Full Dashboard" />
      </Page>
    </Document>
  )
}
