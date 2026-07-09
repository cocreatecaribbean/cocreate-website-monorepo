const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Parse YYYY-MM-DD as UTC midnight */
export function parseUtcDateOnly(input: string): Date | null {
  if (!DATE_RE.test(input)) return null
  const d = new Date(`${input}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) return null
  return d
}

export function formatUtcDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function utcTodayDateOnly(): Date {
  return parseUtcDateOnly(formatUtcDateOnly(new Date()))!
}

export function startOfUtcDay(date: Date): Date {
  return parseUtcDateOnly(formatUtcDateOnly(date))!
}

export function endOfUtcDay(date: Date): Date {
  const start = startOfUtcDay(date)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  end.setUTCMilliseconds(end.getUTCMilliseconds() - 1)
  return end
}

export function firstDayOfUtcCalendarMonth(date: Date): Date {
  const normalized = startOfUtcDay(date)
  return parseUtcDateOnly(
    formatUtcDateOnly(new Date(Date.UTC(normalized.getUTCFullYear(), normalized.getUTCMonth(), 1))),
  )!
}

export function lastDayOfUtcCalendarMonth(date: Date): Date {
  const normalized = startOfUtcDay(date)
  return parseUtcDateOnly(
    formatUtcDateOnly(new Date(Date.UTC(normalized.getUTCFullYear(), normalized.getUTCMonth() + 1, 0))),
  )!
}

/** Calendar month represented by snapshotDate (snapshot key = last day of month). */
export function calendarMonthPeriodForSnapshot(snapshotDate: Date): {
  periodStart: Date
  periodEnd: Date
} {
  const normalized = startOfUtcDay(snapshotDate)
  const periodStart = firstDayOfUtcCalendarMonth(normalized)
  const periodEnd = endOfUtcDay(lastDayOfUtcCalendarMonth(normalized))
  return { periodStart, periodEnd }
}

/** Last day of the calendar month before `from` (used for scheduled monthly capture). */
export function previousCalendarMonthSnapshotDate(from: Date = utcTodayDateOnly()): Date {
  const normalized = startOfUtcDay(from)
  const priorMonth = new Date(Date.UTC(normalized.getUTCFullYear(), normalized.getUTCMonth() - 1, 1))
  return lastDayOfUtcCalendarMonth(priorMonth)
}

/** @deprecated Use calendarMonthPeriodForSnapshot — rolling 30-day window */
export function snapshotPeriodForDate(snapshotDate: Date): {
  periodStart: Date
  periodEnd: Date
} {
  const periodEnd = endOfUtcDay(snapshotDate)
  const periodStart = new Date(periodEnd)
  periodStart.setUTCDate(periodStart.getUTCDate() - 29)
  return { periodStart: startOfUtcDay(periodStart), periodEnd }
}
