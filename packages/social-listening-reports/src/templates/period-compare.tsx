import { Document, Page, Text, View } from '@react-pdf/renderer'
import { PdfPlatformBars, PdfSentimentDonut } from '../charts/pdf-charts'
import { ChartCard } from '../components/layout/chart-card'
import { HeroKpiStrip } from '../components/layout/hero-kpi-strip'
import { InteriorPageHeader } from '../components/layout/interior-page-header'
import { SectionMasthead } from '../components/layout/section-masthead'
import { CoverPageLetter, ReportFooter } from '../components/report-chrome'
import { LETTER_PAGE_SIZE } from '../page-sizes'
import type { ReportRenderContext } from '../types'
import { letterTheme } from '../theme'

export function PeriodCompareDocument({ context }: { context: ReportRenderContext }) {
  const { data } = context.snapshot
  const compare = context.compare!

  return (
    <Document title={`${context.organization.name} — Period Comparison`}>
      <Page size={LETTER_PAGE_SIZE}>
        <CoverPageLetter
          context={context}
          title="Social Listening"
          subtitle={`Period comparison · ${compare.current.date} vs ${compare.baseline.date}`}
        />
        <ReportFooter context={context} templateLabel="Period Compare" format="letter" />
      </Page>

      <Page size={LETTER_PAGE_SIZE} style={letterTheme.page}>
        <SectionMasthead eyebrow="Comparison" title="Period-over-period KPIs" format="letter" />
        <InteriorPageHeader
          organizationName={context.organization.name}
          sectionLabel="Period compare"
          format="letter"
        />
        <Text style={letterTheme.compareChip}>
          Baseline {compare.baseline.date} → Current {compare.current.date}
        </Text>
        <HeroKpiStrip data={data} compare={compare} format="letter" />
        <ReportFooter context={context} templateLabel="Period Compare" format="letter" />
      </Page>

      <Page size={LETTER_PAGE_SIZE} style={letterTheme.page}>
        <SectionMasthead eyebrow="Sentiment shift" title="Baseline vs current" format="letter" />
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <View style={{ flex: 1 }}>
            <ChartCard title={`Baseline · ${compare.baseline.date}`} format="letter">
              <PdfSentimentDonut
                slices={compare.baseline.data.sentimentSummary}
                format="letter"
              />
            </ChartCard>
          </View>
          <View style={{ flex: 1 }}>
            <ChartCard title={`Current · ${compare.current.date}`} format="letter">
              <PdfSentimentDonut
                slices={compare.current.data.sentimentSummary}
                format="letter"
              />
            </ChartCard>
          </View>
        </View>
        <ChartCard
          title="Platform mix (current period)"
          subtitle="Where mentions concentrated in the current snapshot"
          format="letter"
        >
          <PdfPlatformBars rows={compare.current.data.sourceBreakdown} format="letter" />
        </ChartCard>
        <ReportFooter context={context} templateLabel="Period Compare" format="letter" />
      </Page>
    </Document>
  )
}
