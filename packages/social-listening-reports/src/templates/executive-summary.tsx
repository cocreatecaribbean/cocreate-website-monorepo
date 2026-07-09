import { Document, Page, View } from '@react-pdf/renderer'
import { PdfPlatformBars, PdfSentimentDonut } from '../charts/pdf-charts'
import { ChartCard } from '../components/layout/chart-card'
import { HeroKpiStrip } from '../components/layout/hero-kpi-strip'
import { InsightCallout } from '../components/layout/insight-callout'
import { InteriorPageHeader } from '../components/layout/interior-page-header'
import { SectionMasthead } from '../components/layout/section-masthead'
import { CoverPageLetter, ReportFooter } from '../components/report-chrome'
import { LETTER_PAGE_SIZE } from '../page-sizes'
import type { ReportRenderContext } from '../types'
import { letterTheme } from '../theme'
import { buildReportInsights } from '../utils/insights'

export function ExecutiveSummaryDocument({ context }: { context: ReportRenderContext }) {
  const { data } = context.snapshot
  const insights = buildReportInsights(data)

  return (
    <Document title={`${context.organization.name} — Executive Summary`}>
      <Page size={LETTER_PAGE_SIZE}>
        <CoverPageLetter
          context={context}
          title="Social Listening"
          subtitle="Executive summary"
        />
        <ReportFooter context={context} templateLabel="Executive Summary" format="letter" />
      </Page>

      <Page size={LETTER_PAGE_SIZE} style={letterTheme.page}>
        <SectionMasthead eyebrow="Overview" title="Mention performance" format="letter" />
        <InteriorPageHeader
          organizationName={context.organization.name}
          sectionLabel="Executive summary"
          format="letter"
        />
        <HeroKpiStrip data={data} compare={context.compare} format="letter" />
        <InsightCallout
          headline={insights.headline}
          detail={insights.detail}
          format="letter"
        />
        <ReportFooter context={context} templateLabel="Executive Summary" format="letter" />
      </Page>

      <Page size={LETTER_PAGE_SIZE} style={letterTheme.page}>
        <SectionMasthead eyebrow="Analysis" title="Sentiment & channels" format="letter" />
        <InteriorPageHeader
          organizationName={context.organization.name}
          sectionLabel="Charts"
          format="letter"
        />
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <View style={{ flex: 1 }}>
            <ChartCard
              title="Sentiment breakdown"
              subtitle="Share of positive, neutral, and negative mentions"
              format="letter"
            >
              <PdfSentimentDonut slices={data.sentimentSummary} format="letter" hideLegend={false} />
            </ChartCard>
          </View>
          <View style={{ flex: 1 }}>
            <ChartCard
              title="Mentions by platform"
              subtitle="Volume ranked across tracked social channels"
              format="letter"
            >
              <PdfPlatformBars rows={data.sourceBreakdown} format="letter" />
            </ChartCard>
          </View>
        </View>
        <ReportFooter context={context} templateLabel="Executive Summary" format="letter" />
      </Page>
    </Document>
  )
}
