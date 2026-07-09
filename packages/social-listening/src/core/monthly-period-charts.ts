import type {
  MentionMatrixRow,
  ReachEngagementSeries,
  SentimentOverTimeRow,
  SocialListeningAnalytics,
} from './types'

export type CalendarWeekBucket = {
  weekIndex: number
  startDate: string
  endDate: string
  label: string
}

export type MonthlyPeriodBounds = {
  periodStart?: string
  periodEnd?: string
  snapshotDate?: string
}

export type MonthlyTrendPoint = {
  monthKey: string
  monthLabel: string
  periodLabel: string
  totalMentions: number
  snapshotDate: string
}

export type SnapshotWithTotalMentions = {
  date: string
  periodStart: string
  periodEnd: string
  totalMentions?: number
}

const TIME_BLOCKS = ['12am-6am', '6am-12pm', '12pm-6pm', '6pm-12am'] as const
const WEEKDAY_IDS = new Set([
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
])

function parseUtcDateOnly(iso: string): Date {
  const day = iso.slice(0, 10)
  return new Date(`${day}T00:00:00.000Z`)
}

function formatUtcDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function formatShortMonthDay(iso: string): string {
  return parseUtcDateOnly(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function formatMonthYear(iso: string): string {
  return parseUtcDateOnly(iso).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatMonthlyPeriodTitle(periodStart?: string): string | null {
  if (!periodStart) return null
  return formatMonthYear(periodStart)
}

export function formatWeeklyWithinMonthDescription(
  periodStart?: string,
  base = 'Weekly breakdown',
): string {
  const monthTitle = formatMonthlyPeriodTitle(periodStart)
  return monthTitle ? `${base} · ${monthTitle}` : base
}

function formatWeekRangeLabel(startDate: string, endDate: string): string {
  const start = parseUtcDateOnly(startDate)
  const end = parseUtcDateOnly(endDate)
  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `${start.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })} ${start.getUTCDate()}–${end.getUTCDate()}`
  }
  return `${formatShortMonthDay(startDate)} – ${formatShortMonthDay(endDate)}`
}

function lastDayOfUtcCalendarMonth(date: Date): number {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate()
}

function isCalendarMonthPeriod(periodStart: string, periodEnd: string): boolean {
  const start = parseUtcDateOnly(periodStart)
  const end = parseUtcDateOnly(periodEnd)
  return (
    start.getUTCDate() === 1 &&
    end.getUTCMonth() === start.getUTCMonth() &&
    end.getUTCFullYear() === start.getUTCFullYear() &&
    end.getUTCDate() === lastDayOfUtcCalendarMonth(end)
  )
}

export function isFullCalendarMonthSnapshot(
  periodStart: string,
  periodEnd: string,
): boolean {
  return isCalendarMonthPeriod(
    periodStart.slice(0, 10),
    periodEnd.slice(0, 10),
  )
}

export function calendarMonthKey(iso: string): string {
  return iso.slice(0, 7)
}

function formatPeriodLabel(periodStart: string, periodEnd: string): string {
  const start = periodStart.slice(0, 10)
  const end = periodEnd.slice(0, 10)
  const startDate = parseUtcDateOnly(start)
  const endDate = parseUtcDateOnly(end)
  const startText = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
  const endText = endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return start === end ? endText : `${startText} – ${endText}`
}

function pickCanonicalSnapshot(
  candidates: SnapshotWithTotalMentions[],
): SnapshotWithTotalMentions | undefined {
  if (!candidates.length) return undefined

  return [...candidates].sort((a, b) => {
    const aFull = isFullCalendarMonthSnapshot(a.periodStart, a.periodEnd) ? 1 : 0
    const bFull = isFullCalendarMonthSnapshot(b.periodStart, b.periodEnd) ? 1 : 0
    if (aFull !== bFull) return bFull - aFull
    return b.date.localeCompare(a.date)
  })[0]
}

const MAX_MONTHLY_TREND_MONTHS = 12

export function aggregateSnapshotsByCalendarMonth(
  snapshots: SnapshotWithTotalMentions[],
): MonthlyTrendPoint[] {
  const grouped = new Map<string, SnapshotWithTotalMentions[]>()

  for (const snapshot of snapshots) {
    if (typeof snapshot.totalMentions !== 'number') continue
    const monthKey = calendarMonthKey(snapshot.periodStart || snapshot.date)
    const bucket = grouped.get(monthKey) ?? []
    bucket.push(snapshot)
    grouped.set(monthKey, bucket)
  }

  const points = [...grouped.entries()]
    .map(([monthKey, candidates]) => {
      const canonical = pickCanonicalSnapshot(candidates)
      if (!canonical) return null
      return {
        monthKey,
        monthLabel: formatMonthYear(canonical.periodStart || canonical.date),
        periodLabel: formatPeriodLabel(canonical.periodStart, canonical.periodEnd),
        totalMentions: canonical.totalMentions!,
        snapshotDate: canonical.date,
      }
    })
    .filter((point): point is MonthlyTrendPoint => point !== null)
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))

  return points.slice(-MAX_MONTHLY_TREND_MONTHS)
}

function clampDateToPeriod(date: string, periodStart: string, periodEnd: string): boolean {
  return date >= periodStart.slice(0, 10) && date <= periodEnd.slice(0, 10)
}

export function resolvePeriodBounds(
  bounds: MonthlyPeriodBounds,
  sentimentOverTime: SentimentOverTimeRow[] = [],
): { periodStart: string; periodEnd: string } | null {
  if (bounds.periodStart && bounds.periodEnd) {
    return {
      periodStart: bounds.periodStart.slice(0, 10),
      periodEnd: bounds.periodEnd.slice(0, 10),
    }
  }

  if (sentimentOverTime.length > 0) {
    const dates = sentimentOverTime.map((row) => row.date.slice(0, 10)).sort()
    return {
      periodStart: dates[0]!,
      periodEnd: dates[dates.length - 1]!,
    }
  }

  if (bounds.snapshotDate) {
    const snapshot = parseUtcDateOnly(bounds.snapshotDate)
    const periodStart = formatUtcDateOnly(
      new Date(Date.UTC(snapshot.getUTCFullYear(), snapshot.getUTCMonth(), 1)),
    )
    const periodEnd = formatUtcDateOnly(
      new Date(Date.UTC(snapshot.getUTCFullYear(), snapshot.getUTCMonth() + 1, 0)),
    )
    return { periodStart, periodEnd }
  }

  return null
}

export function enumerateCalendarWeeksInPeriod(
  periodStart: string,
  periodEnd: string,
): CalendarWeekBucket[] {
  const start = periodStart.slice(0, 10)
  const end = periodEnd.slice(0, 10)

  if (isCalendarMonthPeriod(start, end)) {
    const monthStart = parseUtcDateOnly(start)
    const lastDay = lastDayOfUtcCalendarMonth(monthStart)
    const ranges: Array<[number, number]> = [
      [1, 7],
      [8, 14],
      [15, 21],
      [22, 28],
      [29, lastDay],
    ]

    const buckets: CalendarWeekBucket[] = []
    for (const [rangeStart, rangeEnd] of ranges) {
      if (rangeStart > lastDay) continue
      const bucketStart = formatUtcDateOnly(
        new Date(
          Date.UTC(
            monthStart.getUTCFullYear(),
            monthStart.getUTCMonth(),
            rangeStart,
          ),
        ),
      )
      const bucketEnd = formatUtcDateOnly(
        new Date(
          Date.UTC(
            monthStart.getUTCFullYear(),
            monthStart.getUTCMonth(),
            Math.min(rangeEnd, lastDay),
          ),
        ),
      )
      if (bucketEnd < start || bucketStart > end) continue
      const clippedStart = bucketStart < start ? start : bucketStart
      const clippedEnd = bucketEnd > end ? end : bucketEnd
      buckets.push({
        weekIndex: buckets.length,
        startDate: clippedStart,
        endDate: clippedEnd,
        label: formatWeekRangeLabel(clippedStart, clippedEnd),
      })
    }
    return buckets
  }

  const buckets: CalendarWeekBucket[] = []
  let cursor = parseUtcDateOnly(start)
  const periodEndDate = parseUtcDateOnly(end)

  while (cursor <= periodEndDate) {
    const bucketStart = formatUtcDateOnly(cursor)
    const bucketEndDate = addUtcDays(cursor, 6)
    const clippedEnd =
      bucketEndDate > periodEndDate ? periodEndDate : bucketEndDate
    const bucketEnd = formatUtcDateOnly(clippedEnd)
    buckets.push({
      weekIndex: buckets.length,
      startDate: bucketStart,
      endDate: bucketEnd,
      label: formatWeekRangeLabel(bucketStart, bucketEnd),
    })
    cursor = addUtcDays(clippedEnd, 1)
  }

  return buckets
}

function findWeekBucketForDate(
  date: string,
  buckets: CalendarWeekBucket[],
): CalendarWeekBucket | undefined {
  const day = date.slice(0, 10)
  return buckets.find((bucket) => day >= bucket.startDate && day <= bucket.endDate)
}

function looksLikeWeeklySentimentData(rows: SentimentOverTimeRow[]): boolean {
  if (rows.length === 0 || rows.length > 5) return false
  return rows.every((row) => {
    const value = row.date.trim()
    return /^Week\s+\d+/i.test(value) || value.includes('–') || !/^\d{4}-\d{2}-\d{2}$/.test(value)
  })
}

function looksLikeWeeklyReachData(series: ReachEngagementSeries[]): boolean {
  const reach = series.find((item) => item.id.toLowerCase().includes('reach'))
  if (!reach?.data.length || reach.data.length > 5) return false
  return reach.data.every((point) => /^Week\s+\d+/i.test(point.x) || point.x.includes('–'))
}

function looksLikeWeeklyMentionMatrix(matrix: MentionMatrixRow[]): boolean {
  if (!matrix.length) return false
  return matrix.every((row) => !WEEKDAY_IDS.has(row.id))
}

export function aggregateSentimentOverTimeByWeek(
  rows: SentimentOverTimeRow[],
  period: { periodStart: string; periodEnd: string },
): SentimentOverTimeRow[] {
  if (!rows.length) return rows
  if (looksLikeWeeklySentimentData(rows)) {
    return rows.map((row) => ({
      ...row,
      date: row.date.includes('–') ? row.date : row.date,
    }))
  }

  const buckets = enumerateCalendarWeeksInPeriod(period.periodStart, period.periodEnd)
  if (!buckets.length) return rows

  const aggregated = buckets.map((bucket) => ({
    date: bucket.startDate,
    positive: 0,
    neutral: 0,
    negative: 0,
    label: bucket.label,
  }))

  for (const row of rows) {
    const day = row.date.slice(0, 10)
    if (!clampDateToPeriod(day, period.periodStart, period.periodEnd)) continue
    const bucket = findWeekBucketForDate(day, buckets)
    if (!bucket) continue
    const target = aggregated.find((item) => item.date === bucket.startDate)
    if (!target) continue
    target.positive += row.positive
    target.neutral += row.neutral
    target.negative += row.negative
  }

  return aggregated.map(({ label: _label, ...row }) => row)
}

export function aggregateReachEngagementByWeek(
  series: ReachEngagementSeries[],
  period: { periodStart: string; periodEnd: string },
  sentimentOverTime?: SentimentOverTimeRow[],
): ReachEngagementSeries[] {
  if (!series.length) return series
  if (looksLikeWeeklyReachData(series)) {
    const buckets = enumerateCalendarWeeksInPeriod(period.periodStart, period.periodEnd)
    return series.map((item) => ({
      ...item,
      data: item.data.map((point, index) => ({
        ...point,
        x: buckets[index]?.label ?? point.x,
      })),
    }))
  }

  const buckets = enumerateCalendarWeeksInPeriod(period.periodStart, period.periodEnd)
  if (!buckets.length) return series

  const reachSeries = series.find((item) => item.id.toLowerCase().includes('reach'))
  const engagementSeries = series.find((item) =>
    item.id.toLowerCase().includes('engagement'),
  )

  if (!reachSeries?.data.length) return series

  const dailyTotals = new Map<string, { reach: number; engagement: number }>()
  for (const point of reachSeries.data) {
    const day = point.x.slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      dailyTotals.set(day, {
        reach: point.y,
        engagement:
          engagementSeries?.data.find((p) => p.x.slice(0, 10) === day)?.y ?? 0,
      })
    }
  }

  if (dailyTotals.size === 0 && sentimentOverTime?.length) {
    for (const row of sentimentOverTime) {
      const day = row.date.slice(0, 10)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue
      dailyTotals.set(day, { reach: 0, engagement: 0 })
    }
    for (const item of reachSeries.data) {
      const match = [...dailyTotals.keys()].find((day) => item.x.includes(day.slice(5)))
      if (match) {
        dailyTotals.set(match, {
          reach: item.y,
          engagement:
            engagementSeries?.data[reachSeries.data.indexOf(item)]?.y ?? 0,
        })
      }
    }
  }

  const weeklyReach = buckets.map((bucket) => {
    let reach = 0
    let engagement = 0
    let cursor = parseUtcDateOnly(bucket.startDate)
    const end = parseUtcDateOnly(bucket.endDate)
    while (cursor <= end) {
      const day = formatUtcDateOnly(cursor)
      const totals = dailyTotals.get(day)
      if (totals) {
        reach += totals.reach
        engagement += totals.engagement
      }
      cursor = addUtcDays(cursor, 1)
    }
    return { x: bucket.label, y: reach, engagement }
  })

  return [
    {
      id: reachSeries.id,
      data: weeklyReach.map(({ x, y }) => ({ x, y })),
    },
    {
      id: engagementSeries?.id ?? 'Engagement Volume',
      data: weeklyReach.map(({ x, engagement }) => ({ x, y: engagement })),
    },
  ]
}

function distributeWeekdayMatrixToWeeks(
  matrix: MentionMatrixRow[],
  buckets: CalendarWeekBucket[],
  sentimentOverTime?: SentimentOverTimeRow[],
): MentionMatrixRow[] {
  const weeklyTotals =
    sentimentOverTime?.reduce(
      (sum, row) => sum + row.positive + row.neutral + row.negative,
      0,
    ) ?? matrix.reduce(
      (sum, row) => sum + row.data.reduce((rowSum, cell) => rowSum + cell.y, 0),
      0,
    )

  const perWeek = Math.max(1, Math.round(weeklyTotals / Math.max(buckets.length, 1)))

  return buckets.map((bucket, weekIndex) => ({
    id: bucket.label,
    data: TIME_BLOCKS.map((block, blockIndex) => ({
      x: block,
      y: Math.round(
        (matrix[weekIndex % matrix.length]?.data[blockIndex]?.y ?? perWeek / 4) *
          (0.85 + (weekIndex + blockIndex) * 0.05),
      ),
    })),
  }))
}

export function aggregateMentionMatrixByWeek(
  matrix: MentionMatrixRow[],
  period: { periodStart: string; periodEnd: string },
  sentimentOverTime?: SentimentOverTimeRow[],
): MentionMatrixRow[] {
  if (!matrix.length) return matrix

  const buckets = enumerateCalendarWeeksInPeriod(period.periodStart, period.periodEnd)
  if (!buckets.length) return matrix

  if (looksLikeWeeklyMentionMatrix(matrix)) {
    return matrix.map((row, index) => ({
      ...row,
      id: buckets[index]?.label ?? row.id,
    }))
  }

  if (matrix.some((row) => WEEKDAY_IDS.has(row.id))) {
    return distributeWeekdayMatrixToWeeks(matrix, buckets, sentimentOverTime)
  }

  return buckets.map((bucket) => ({
    id: bucket.label,
    data: TIME_BLOCKS.map((block) => ({ x: block, y: 0 })),
  }))
}

export function buildMonthlyTrendPoints(
  snapshots: SnapshotWithTotalMentions[],
): MonthlyTrendPoint[] {
  return aggregateSnapshotsByCalendarMonth(snapshots)
}

export function buildMonthlyChartViews(
  data: SocialListeningAnalytics,
  bounds: MonthlyPeriodBounds,
): SocialListeningAnalytics {
  const period = resolvePeriodBounds(bounds, data.sentimentOverTime)
  if (!period) return data

  return {
    ...data,
    sentimentOverTime: aggregateSentimentOverTimeByWeek(data.sentimentOverTime, period),
    reachVsEngagement: aggregateReachEngagementByWeek(
      data.reachVsEngagement,
      period,
      data.sentimentOverTime,
    ),
    mentionMatrix: aggregateMentionMatrixByWeek(
      data.mentionMatrix,
      period,
      data.sentimentOverTime,
    ),
  }
}

export function formatSentimentStreamLabel(
  row: SentimentOverTimeRow,
  period: { periodStart: string; periodEnd: string },
): string {
  const day = row.date.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return row.date

  const bucket = findWeekBucketForDate(
    day,
    enumerateCalendarWeeksInPeriod(period.periodStart, period.periodEnd),
  )
  return bucket?.label ?? formatShortMonthDay(day)
}
