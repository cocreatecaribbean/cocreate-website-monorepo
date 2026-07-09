import { Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { ReportFormat } from '../../page-sizes'
import { getReportTheme } from '../../theme'

export function ChartCard({
  title,
  subtitle,
  format = 'letter',
  children,
  hideHeader = false,
}: {
  title?: string
  subtitle?: string
  format?: ReportFormat
  children: ReactNode
  hideHeader?: boolean
}) {
  const styles = getReportTheme(format)
  return (
    <View style={styles.chartCard}>
      {!hideHeader && title ? (
        <>
          <Text style={styles.chartCardTitle}>{title}</Text>
          {subtitle ? <Text style={styles.chartCardSubtitle}>{subtitle}</Text> : null}
        </>
      ) : null}
      {children}
    </View>
  )
}
