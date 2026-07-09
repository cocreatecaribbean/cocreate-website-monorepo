import { BadRequestException } from '@nestjs/common'
import {
  firstDayOfUtcCalendarMonth,
  formatUtcDateOnly,
  lastDayOfUtcCalendarMonth,
  parseUtcDateOnly,
  startOfUtcDay,
  utcTodayDateOnly,
} from './social-listening-dates'

const MAX_RANGE_DAYS = 92

export function validateListeningSetupDateRange(
  startDateStr: string,
  endDateStr: string,
): { start: Date; end: Date } {
  const start = parseUtcDateOnly(startDateStr)
  const end = parseUtcDateOnly(endDateStr)
  const today = utcTodayDateOnly()

  if (!start || !end) {
    throw new BadRequestException('Dates must be YYYY-MM-DD')
  }

  if (start > end) {
    throw new BadRequestException('Start date must be on or before end date')
  }

  if (end > today) {
    throw new BadRequestException('End date cannot be in the future')
  }

  const earliest = new Date(today)
  earliest.setUTCDate(earliest.getUTCDate() - MAX_RANGE_DAYS)
  if (start < earliest) {
    throw new BadRequestException(
      `Start date must be within the last ${MAX_RANGE_DAYS} days`,
    )
  }

  return { start, end }
}

export function enumerateUtcDatesInclusive(start: Date, end: Date): Date[] {
  const dates: Date[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    dates.push(parseUtcDateOnly(formatUtcDateOnly(cursor))!)
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return dates
}

/** Monthly cadence for historical setup backfill — last day of each complete calendar month in range. */
export function enumerateUtcMonthlySnapshotDates(start: Date, end: Date): Date[] {
  const startNorm = startOfUtcDay(start)
  const endNorm = startOfUtcDay(end)
  const dates: Date[] = []

  let cursor = firstDayOfUtcCalendarMonth(startNorm)
  while (cursor <= endNorm) {
    const monthEnd = lastDayOfUtcCalendarMonth(cursor)
    if (monthEnd >= startNorm && monthEnd <= endNorm) {
      dates.push(monthEnd)
    }
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
  }

  return dates
}

/** @deprecated Use enumerateUtcMonthlySnapshotDates */
export const SETUP_BACKFILL_WEEKLY_STEP_DAYS = 7

/** @deprecated Use enumerateUtcMonthlySnapshotDates */
export function enumerateUtcWeeklyDatesInclusive(start: Date, end: Date): Date[] {
  const dates: Date[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    dates.push(parseUtcDateOnly(formatUtcDateOnly(cursor))!)
    cursor.setUTCDate(cursor.getUTCDate() + SETUP_BACKFILL_WEEKLY_STEP_DAYS)
  }
  const endNorm = parseUtcDateOnly(formatUtcDateOnly(end))!
  const last = dates[dates.length - 1]
  if (!last || formatUtcDateOnly(last) !== formatUtcDateOnly(endNorm)) {
    dates.push(endNorm)
  }
  return dates
}
