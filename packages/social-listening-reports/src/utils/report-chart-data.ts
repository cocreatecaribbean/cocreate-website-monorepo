import { buildMonthlyChartViews } from '@cocreate/social-listening/core'
import type { ReportSnapshotBundle } from '../types'

export function prepareReportChartData(snapshot: ReportSnapshotBundle) {
  return buildMonthlyChartViews(snapshot.data, {
    periodStart: snapshot.meta.periodStart,
    periodEnd: snapshot.meta.periodEnd,
    snapshotDate: snapshot.meta.snapshotDate,
  })
}
