import { Circle, Image, Path, Svg, Text, View } from '@react-pdf/renderer'
import type { ReportFormat } from '../page-sizes'
import type { ReportRenderContext } from '../types'
import { getReportTheme, colors } from '../theme'

function orgInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function reportPeriod(context: ReportRenderContext): string {
  const { snapshot } = context
  if (snapshot.meta.periodStart && snapshot.meta.periodEnd) {
    return `${snapshot.meta.periodStart.slice(0, 10)} – ${snapshot.meta.periodEnd.slice(0, 10)}`
  }
  return 'Reporting period'
}

function CoverDecor({ format }: { format: ReportFormat }) {
  const isDeck = format === 'deck'
  const w = isDeck ? 1920 : 612
  const h = isDeck ? 1080 : 792
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Path
          d={`M ${w} 0 L ${w} ${h * 0.45} L ${w * 0.55} 0 Z`}
          fill={colors.coverGradientStart}
          opacity={0.55}
        />
        <Circle
          cx={isDeck ? w * 0.88 : w * 0.82}
          cy={isDeck ? h * 0.72 : h * 0.68}
          r={isDeck ? 220 : 100}
          fill={colors.casablanca}
          opacity={0.12}
        />
        <Circle
          cx={isDeck ? w * 0.08 : w * 0.06}
          cy={isDeck ? h * 0.92 : h * 0.9}
          r={isDeck ? 160 : 70}
          fill={colors.sanmarino}
          opacity={0.18}
        />
      </Svg>
    </View>
  )
}

function LogoWell({
  context,
  format,
}: {
  context: ReportRenderContext
  format: ReportFormat
}) {
  const styles = getReportTheme(format)
  const { organization } = context

  return (
    <View style={styles.coverLogoWell}>
      {organization.logoUrl ? (
        <Image src={organization.logoUrl} style={styles.coverLogoImage} />
      ) : (
        <Text style={styles.coverLogoMonogram}>
          {orgInitials(organization.name) || '?'}
        </Text>
      )}
    </View>
  )
}

export function ReportFooter({
  context,
  templateLabel,
  format = 'letter',
}: {
  context: ReportRenderContext
  templateLabel: string
  format?: ReportFormat
}) {
  const styles = getReportTheme(format)
  const date = context.snapshot.meta.snapshotDate ?? 'Latest'
  return (
    <View style={styles.footer} fixed>
      <Text>
        {context.organization.name} · {templateLabel} · Snapshot {date}
      </Text>
      <Text
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  )
}

export function CoverPageLetter({
  context,
  title,
  subtitle,
}: {
  context: ReportRenderContext
  title: string
  subtitle: string
}) {
  return <CoverPageContent context={context} title={title} subtitle={subtitle} format="letter" />
}

export function CoverPageDeck({
  context,
  title,
  subtitle,
}: {
  context: ReportRenderContext
  title: string
  subtitle: string
}) {
  return <CoverPageContent context={context} title={title} subtitle={subtitle} format="deck" />
}

/** @deprecated Use CoverPageLetter or CoverPageDeck */
export function CoverPage({
  context,
  title,
  subtitle,
}: {
  context: ReportRenderContext
  title: string
  subtitle: string
}) {
  return <CoverPageLetter context={context} title={title} subtitle={subtitle} />
}

function CoverPageContent({
  context,
  title,
  subtitle,
  format,
}: {
  context: ReportRenderContext
  title: string
  subtitle: string
  format: ReportFormat
}) {
  const styles = getReportTheme(format)
  const { organization, snapshot, generatedAt } = context

  return (
    <View style={styles.coverPage}>
      <CoverDecor format={format} />
      <View style={{ zIndex: 1 }}>
        <Text style={styles.coverEyebrow}>Social Listening Intelligence</Text>
        <LogoWell context={context} format={format} />
        <Text style={styles.coverTitle}>{title}</Text>
        <View style={styles.coverAccentLine} />
        <Text style={styles.coverSubtitle}>{subtitle}</Text>
        <Text style={styles.coverMeta}>
          {organization.name}
          {'\n'}
          Snapshot date: {snapshot.meta.snapshotDate ?? '—'}
          {'\n'}
          Period: {reportPeriod(context)}
          {'\n'}
          Generated: {generatedAt.slice(0, 10)}
        </Text>
      </View>
      <Text style={styles.coverFooter}>Prepared by CoCreate Caribbean</Text>
    </View>
  )
}
