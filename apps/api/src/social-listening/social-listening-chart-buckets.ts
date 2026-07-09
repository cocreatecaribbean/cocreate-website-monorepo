import type { SentimentId, SentimentOverTimeRow } from './social-listening.types'

export type CalendarWeekBucket = {
  weekIndex: number
  startDate: string
  endDate: string
  label: string
}

function parseUtcDateOnly(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`)
}

function formatUtcDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function formatWeekRangeLabel(startDate: string, endDate: string): string {
  const start = parseUtcDateOnly(startDate)
  const end = parseUtcDateOnly(endDate)
  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `${start.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })} ${start.getUTCDate()}–${end.getUTCDate()}`
  }
  const formatShort = (iso: string) =>
    parseUtcDateOnly(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
  return `${formatShort(startDate)} – ${formatShort(endDate)}`
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

export function aggregateSentimentOverTimeByWeek(
  rows: SentimentOverTimeRow[],
  period: { periodStart: string; periodEnd: string },
): SentimentOverTimeRow[] {
  if (!rows.length) return rows
  if (rows.length <= 5 && rows.every((row) => !/^\d{4}-\d{2}-\d{2}$/.test(row.date))) {
    return rows
  }

  const buckets = enumerateCalendarWeeksInPeriod(period.periodStart, period.periodEnd)
  if (!buckets.length) return rows

  const aggregated = buckets.map((bucket) => ({
    date: bucket.startDate,
    positive: 0,
    neutral: 0,
    negative: 0,
  }))

  for (const row of rows) {
    const day = row.date.slice(0, 10)
    if (day < period.periodStart || day > period.periodEnd) continue
    const bucket = findWeekBucketForDate(day, buckets)
    if (!bucket) continue
    const target = aggregated.find((item) => item.date === bucket.startDate)
    if (!target) continue
    target.positive += row.positive
    target.neutral += row.neutral
    target.negative += row.negative
  }

  return aggregated
}

export function resolveTimeBlockFromIso(isoDateTime: string | undefined): string {
  if (!isoDateTime) return '12pm-6pm'
  const hour = new Date(isoDateTime).getUTCHours()
  if (hour < 6) return '12am-6am'
  if (hour < 12) return '6am-12pm'
  if (hour < 18) return '12pm-6pm'
  return '6pm-12am'
}

export const TIME_BLOCKS = ['12am-6am', '6am-12pm', '12pm-6pm', '6pm-12am'] as const

export type SentimentCounts = Record<SentimentId, number>
