import { Document, Page } from '@react-pdf/renderer'
import { PdfPlatformBars, PdfReachArea, PdfSentimentDonut, PdfSentimentTrend } from '../charts/pdf-charts'
import { ChartCard } from '../components/layout/chart-card'
import { HeroKpiStrip } from '../components/layout/hero-kpi-strip'
import { InsightCallout } from '../components/layout/insight-callout'
import { SectionMasthead } from '../components/layout/section-masthead'
import { CoverPageDeck, ReportFooter } from '../components/report-chrome'
import { SentimentOverTimeTable } from '../components/sentiment-table'
import { DECK_PAGE_SIZE } from '../page-sizes'
import type { ReportRenderContext } from '../types'
import { deckTheme } from '../theme'
import { buildReportInsights } from '../utils/insights'
import { prepareReportChartData } from '../utils/report-chart-data'

export function FullDashboardDeckDocument({ context }: { context: ReportRenderContext }) {
  const { data, meta } = context.snapshot
  const chartData = prepareReportChartData(context.snapshot)
  const insights = buildReportInsights(data)
  const reachSeries = chartData.reachVsEngagement[0]

  return (
    <Document title={`${context.organization.name} — Full Dashboard (Presentation)`}>
      <Page size={DECK_PAGE_SIZE}>
        <CoverPageDeck
          context={context}
          title="Social Listening"
          subtitle="Full dashboard report"
        />
        <ReportFooter context={context} templateLabel="Full Dashboard Deck" format="deck" />
      </Page>

      <Page size={DECK_PAGE_SIZE} style={deckTheme.page}>
        <SectionMasthead eyebrow="Overview" title="Mention performance" format="deck" />
        <HeroKpiStrip data={data} compare={context.compare} format="deck" />
        <InsightCallout
          headline={insights.headline}
          detail={insights.detail}
          format="deck"
        />
        <ReportFooter context={context} templateLabel="Full Dashboard Deck" format="deck" />
      </Page>

      <Page size={DECK_PAGE_SIZE} style={deckTheme.page}>
        <SectionMasthead eyebrow="Sentiment" title="How people are talking" format="deck" />
        <ChartCard format="deck" hideHeader>
          <PdfSentimentDonut
            slices={data.sentimentSummary}
            format="deck"
            title="Sentiment breakdown"
          />
        </ChartCard>
        <ReportFooter context={context} templateLabel="Full Dashboard Deck" format="deck" />
      </Page>

      <Page size={DECK_PAGE_SIZE} style={deckTheme.page}>
        <SectionMasthead eyebrow="Channels" title="Where mentions live" format="deck" />
        <ChartCard format="deck" hideHeader>
          <PdfPlatformBars
            rows={data.sourceBreakdown}
            format="deck"
            title="Mentions by platform"
          />
        </ChartCard>
        <ReportFooter context={context} templateLabel="Full Dashboard Deck" format="deck" />
      </Page>

      <Page size={DECK_PAGE_SIZE} style={deckTheme.page}>
        <SectionMasthead eyebrow="Reach" title="Audience momentum" format="deck" />
        <ChartCard format="deck" hideHeader>
          <PdfReachArea
            points={reachSeries?.data ?? []}
            format="deck"
            title="Reach trend"
            seriesLabel={reachSeries?.id ?? 'Reach'}
          />
        </ChartCard>
        <ReportFooter context={context} templateLabel="Full Dashboard Deck" format="deck" />
      </Page>

      <Page size={DECK_PAGE_SIZE} style={deckTheme.page}>
        <SectionMasthead eyebrow="Trends" title="Sentiment over time" format="deck" />
        <ChartCard format="deck" hideHeader>
          <PdfSentimentTrend
            rows={chartData.sentimentOverTime}
            format="deck"
            title="Weekly sentiment mix within period"
          />
        </ChartCard>
        <ReportFooter context={context} templateLabel="Full Dashboard Deck" format="deck" />
      </Page>

      <Page size={DECK_PAGE_SIZE} style={deckTheme.page}>
        <SectionMasthead eyebrow="Detail" title="Weekly breakdown" format="deck" />
        <SentimentOverTimeTable
          rows={chartData.sentimentOverTime}
          format="deck"
          compact
          periodStart={meta.periodStart}
          periodEnd={meta.periodEnd}
        />
        <ReportFooter context={context} templateLabel="Full Dashboard Deck" format="deck" />
      </Page>
    </Document>
  )
}
