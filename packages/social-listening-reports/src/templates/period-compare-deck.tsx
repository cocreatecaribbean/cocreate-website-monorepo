import { Document, Page, Text, View } from '@react-pdf/renderer'
import { PdfPlatformBars, PdfSentimentDonut } from '../charts/pdf-charts'
import { ChartCard } from '../components/layout/chart-card'
import { HeroKpiStrip } from '../components/layout/hero-kpi-strip'
import { SectionMasthead } from '../components/layout/section-masthead'
import { CoverPageDeck, ReportFooter } from '../components/report-chrome'
import { DECK_PAGE_SIZE } from '../page-sizes'
import type { ReportRenderContext } from '../types'
import { deckTheme } from '../theme'

export function PeriodCompareDeckDocument({ context }: { context: ReportRenderContext }) {
  const { data } = context.snapshot
  const compare = context.compare!

  return (
    <Document title={`${context.organization.name} — Period Comparison (Presentation)`}>
      <Page size={DECK_PAGE_SIZE}>
        <CoverPageDeck
          context={context}
          title="Social Listening"
          subtitle={`Period comparison · ${compare.current.date} vs ${compare.baseline.date}`}
        />
        <ReportFooter context={context} templateLabel="Period Compare Deck" format="deck" />
      </Page>

      <Page size={DECK_PAGE_SIZE} style={deckTheme.page}>
        <SectionMasthead eyebrow="Comparison" title="Period-over-period KPIs" format="deck" />
        <Text style={deckTheme.compareChip}>
          Baseline {compare.baseline.date} → Current {compare.current.date}
        </Text>
        <HeroKpiStrip data={data} compare={compare} format="deck" />
        <ReportFooter context={context} templateLabel="Period Compare Deck" format="deck" />
      </Page>

      <Page size={DECK_PAGE_SIZE} style={deckTheme.page}>
        <SectionMasthead
          eyebrow="Sentiment shift"
          title={`${compare.baseline.date} vs ${compare.current.date}`}
          format="deck"
        />
        <View style={{ flexDirection: 'row', gap: 48 }}>
          <View style={{ flex: 1 }}>
            <ChartCard format="deck" hideHeader>
              <PdfSentimentDonut
                slices={compare.baseline.data.sentimentSummary}
                format="deck"
                title="Baseline"
              />
            </ChartCard>
          </View>
          <View style={{ flex: 1 }}>
            <ChartCard format="deck" hideHeader>
              <PdfSentimentDonut
                slices={compare.current.data.sentimentSummary}
                format="deck"
                title="Current"
              />
            </ChartCard>
          </View>
        </View>
        <ReportFooter context={context} templateLabel="Period Compare Deck" format="deck" />
      </Page>

      <Page size={DECK_PAGE_SIZE} style={deckTheme.page}>
        <SectionMasthead eyebrow="Platforms" title="Current period channel mix" format="deck" />
        <ChartCard format="deck" hideHeader>
          <PdfPlatformBars rows={compare.current.data.sourceBreakdown} format="deck" title="Mentions by platform" />
        </ChartCard>
        <ReportFooter context={context} templateLabel="Period Compare Deck" format="deck" />
      </Page>
    </Document>
  )
}
