import { Text, View } from '@react-pdf/renderer'
import type { ReportRenderContext } from '../types'
import { theme } from '../theme'

export function ReportFooter({
  context,
  templateLabel,
}: {
  context: ReportRenderContext
  templateLabel: string
}) {
  const date = context.snapshot.meta.snapshotDate ?? 'Latest'
  return (
    <View style={theme.footer} fixed>
      <Text>
        {context.organization.name} · {templateLabel} · Snapshot {date}
      </Text>
      <Text
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  )
}

export function CoverPage({
  context,
  title,
  subtitle,
}: {
  context: ReportRenderContext
  title: string
  subtitle: string
}) {
  const { organization, snapshot, generatedAt } = context
  const period =
    snapshot.meta.periodStart && snapshot.meta.periodEnd
      ? `${snapshot.meta.periodStart.slice(0, 10)} – ${snapshot.meta.periodEnd.slice(0, 10)}`
      : 'Reporting period'

  return (
    <View style={theme.coverPage}>
      <Text style={theme.coverEyebrow}>CoCreate Caribbean</Text>
      <Text style={theme.coverTitle}>{title}</Text>
      <Text style={theme.coverSubtitle}>{subtitle}</Text>
      <Text style={theme.coverMeta}>
        {organization.name}
        {'\n'}
        Snapshot date: {snapshot.meta.snapshotDate ?? '—'}
        {'\n'}
        Period: {period}
        {'\n'}
        Generated: {generatedAt.slice(0, 10)}
      </Text>
    </View>
  )
}
