import { Document, Page, Text, View } from '@react-pdf/renderer'
import { PdfPlatformBars, PdfReachArea, PdfSentimentDonut, PdfSentimentTrend } from '../charts/pdf-charts'
import { ChartCard } from '../components/layout/chart-card'
import { HeroKpiStrip } from '../components/layout/hero-kpi-strip'
import { InsightCallout } from '../components/layout/insight-callout'
import { InteriorPageHeader } from '../components/layout/interior-page-header'
import { SectionMasthead } from '../components/layout/section-masthead'
import { CoverPageLetter, ReportFooter } from '../components/report-chrome'
import { SentimentOverTimeTable } from '../components/sentiment-table'
import { LETTER_PAGE_SIZE } from '../page-sizes'
import type { ReportRenderContext } from '../types'
import { letterTheme } from '../theme'
import { buildReportInsights } from '../utils/insights'
import { prepareReportChartData } from '../utils/report-chart-data'

export function FullDashboardDocument({ context }: { context: ReportRenderContext }) {
  const { data, meta } = context.snapshot
  const chartData = prepareReportChartData(context.snapshot)
  const insights = buildReportInsights(data)
  const reachSeries = chartData.reachVsEngagement[0]

  return (
    <Document title={`${context.organization.name} — Full Dashboard`}>
      <Page size={LETTER_PAGE_SIZE}>
        <CoverPageLetter
          context={context}
          title="Social Listening"
          subtitle="Full dashboard report"
        />
        <ReportFooter context={context} templateLabel="Full Dashboard" format="letter" />
      </Page>

      <Page size={LETTER_PAGE_SIZE} style={letterTheme.page}>
        <SectionMasthead eyebrow="Overview" title="Mention performance" format="letter" />
        <InteriorPageHeader
          organizationName={context.organization.name}
          sectionLabel="Full dashboard"
          format="letter"
        />
        <HeroKpiStrip data={data} compare={context.compare} format="letter" />
        <InsightCallout
          headline={insights.headline}
          detail={insights.detail}
          format="letter"
        />
        <ReportFooter context={context} templateLabel="Full Dashboard" format="letter" />
      </Page>

      <Page size={LETTER_PAGE_SIZE} style={letterTheme.page}>
        <SectionMasthead eyebrow="Analysis" title="Sentiment & platforms" format="letter" />
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <View style={{ flex: 1 }}>
            <ChartCard title="Sentiment breakdown" format="letter">
              <PdfSentimentDonut slices={data.sentimentSummary} format="letter" />
            </ChartCard>
          </View>
          <View style={{ flex: 1 }}>
            <ChartCard title="Mentions by platform" format="letter">
              <PdfPlatformBars rows={data.sourceBreakdown} format="letter" />
            </ChartCard>
          </View>
        </View>
        <ReportFooter context={context} templateLabel="Full Dashboard" format="letter" />
      </Page>

      <Page size={LETTER_PAGE_SIZE} style={letterTheme.page}>
        <SectionMasthead eyebrow="Trends" title="Reach & sentiment over time" format="letter" />
        <ChartCard
          title="Reach trend"
          subtitle={reachSeries?.id ?? 'Social reach'}
          format="letter"
        >
          <PdfReachArea
            points={reachSeries?.data ?? []}
            format="letter"
            seriesLabel={reachSeries?.id ?? 'Reach'}
          />
        </ChartCard>
        <ChartCard title="Sentiment trend" subtitle="Weekly mention mix within period" format="letter">
          <PdfSentimentTrend rows={chartData.sentimentOverTime} format="letter" />
        </ChartCard>
        <ReportFooter context={context} templateLabel="Full Dashboard" format="letter" />
      </Page>

      <Page size={LETTER_PAGE_SIZE} style={letterTheme.page}>
        <SectionMasthead eyebrow="Detail" title="Weekly breakdown" format="letter" />
        <SentimentOverTimeTable
          rows={chartData.sentimentOverTime}
          format="letter"
          compact
          periodStart={meta.periodStart}
          periodEnd={meta.periodEnd}
        />
        {reachSeries ? (
          <View style={{ marginTop: 16 }}>
            <Text style={letterTheme.sectionTitle}>Recent reach values</Text>
            <View style={letterTheme.tableHeader}>
              <Text style={[letterTheme.cellBold, { width: '40%' }]}>Period</Text>
              <Text style={[letterTheme.cellBold, { width: '60%' }]}>Reach</Text>
            </View>
            {reachSeries.data.slice(-5).map((point) => (
              <View key={point.x} style={letterTheme.tableRow}>
                <Text style={[letterTheme.cell, { width: '40%' }]}>{point.x}</Text>
                <Text style={[letterTheme.cellBold, { width: '60%' }]}>
                  {point.y.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        <ReportFooter context={context} templateLabel="Full Dashboard" format="letter" />
      </Page>
    </Document>
  )
}
