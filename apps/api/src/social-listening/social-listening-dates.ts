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

/** Rolling 30-day window ending on snapshotDate (inclusive) */
export function snapshotPeriodForDate(snapshotDate: Date): {
  periodStart: Date
  periodEnd: Date
} {
  const periodEnd = endOfUtcDay(snapshotDate)
  const periodStart = new Date(periodEnd)
  periodStart.setUTCDate(periodStart.getUTCDate() - 29)
  return { periodStart: startOfUtcDay(periodStart), periodEnd }
}
