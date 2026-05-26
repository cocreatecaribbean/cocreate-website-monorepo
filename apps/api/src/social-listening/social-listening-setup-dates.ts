import { BadRequestException } from '@nestjs/common'
import {
  formatUtcDateOnly,
  parseUtcDateOnly,
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
