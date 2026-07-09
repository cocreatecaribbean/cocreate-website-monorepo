import { Document, Page, View } from '@react-pdf/renderer'
import { PdfPlatformBars, PdfSentimentDonut } from '../charts/pdf-charts'
import { ChartCard } from '../components/layout/chart-card'
import { HeroKpiStrip } from '../components/layout/hero-kpi-strip'
import { InsightCallout } from '../components/layout/insight-callout'
import { SectionMasthead } from '../components/layout/section-masthead'
import { CoverPageDeck, ReportFooter } from '../components/report-chrome'
import { DECK_PAGE_SIZE } from '../page-sizes'
import type { ReportRenderContext } from '../types'
import { deckTheme } from '../theme'
import { buildReportInsights } from '../utils/insights'

export function ExecutiveSummaryDeckDocument({ context }: { context: ReportRenderContext }) {
  const { data } = context.snapshot
  const insights = buildReportInsights(data)

  return (
    <Document title={`${context.organization.name} — Executive Summary (Presentation)`}>
      <Page size={DECK_PAGE_SIZE}>
        <CoverPageDeck
          context={context}
          title="Social Listening"
          subtitle="Executive summary"
        />
        <ReportFooter context={context} templateLabel="Executive Summary Deck" format="deck" />
      </Page>

      <Page size={DECK_PAGE_SIZE} style={deckTheme.page}>
        <SectionMasthead eyebrow="Overview" title="Mention performance" format="deck" />
        <HeroKpiStrip data={data} compare={context.compare} format="deck" />
        <InsightCallout
          headline={insights.headline}
          detail={insights.detail}
          format="deck"
        />
        <ReportFooter context={context} templateLabel="Executive Summary Deck" format="deck" />
      </Page>

      <Page size={DECK_PAGE_SIZE} style={deckTheme.page}>
        <SectionMasthead eyebrow="Analysis" title="Sentiment & channels" format="deck" />
        <View style={{ flexDirection: 'row', gap: 32 }}>
          <View style={{ flex: 1 }}>
            <ChartCard format="deck" hideHeader>
              <PdfSentimentDonut
                slices={data.sentimentSummary}
                format="deck"
                title="Sentiment breakdown"
                subtitle="Share of mention sentiment"
              />
            </ChartCard>
          </View>
          <View style={{ flex: 1 }}>
            <ChartCard format="deck" hideHeader>
              <PdfPlatformBars
                rows={data.sourceBreakdown}
                format="deck"
                title="Mentions by platform"
                subtitle="Ranked channel volume"
              />
            </ChartCard>
          </View>
        </View>
        <ReportFooter context={context} templateLabel="Executive Summary Deck" format="deck" />
      </Page>
    </Document>
  )
}
