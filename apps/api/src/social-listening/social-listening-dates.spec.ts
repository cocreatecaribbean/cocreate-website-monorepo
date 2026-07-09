import {
  calendarMonthPeriodForSnapshot,
  formatUtcDateOnly,
  firstDayOfUtcCalendarMonth,
  lastDayOfUtcCalendarMonth,
  parseUtcDateOnly,
  previousCalendarMonthSnapshotDate,
} from './social-listening-dates'

describe('calendarMonthPeriodForSnapshot', () => {
  it('uses the full UTC calendar month for a snapshot dated on month end', () => {
    const snapshotDate = parseUtcDateOnly('2026-06-30')!
    const { periodStart, periodEnd } = calendarMonthPeriodForSnapshot(snapshotDate)
    expect(formatUtcDateOnly(periodStart)).toBe('2026-06-01')
    expect(formatUtcDateOnly(periodEnd)).toBe('2026-06-30')
  })

  it('uses the full UTC calendar month when snapshotDate is mid-month', () => {
    const snapshotDate = parseUtcDateOnly('2026-06-15')!
    const { periodStart, periodEnd } = calendarMonthPeriodForSnapshot(snapshotDate)
    expect(formatUtcDateOnly(periodStart)).toBe('2026-06-01')
    expect(formatUtcDateOnly(periodEnd)).toBe('2026-06-30')
  })
})

describe('previousCalendarMonthSnapshotDate', () => {
  it('returns the last day of the prior calendar month', () => {
    const from = parseUtcDateOnly('2026-07-08')!
    expect(formatUtcDateOnly(previousCalendarMonthSnapshotDate(from))).toBe('2026-06-30')
  })

  it('handles year boundaries', () => {
    const from = parseUtcDateOnly('2026-01-15')!
    expect(formatUtcDateOnly(previousCalendarMonthSnapshotDate(from))).toBe('2025-12-31')
  })
})

describe('month boundary helpers', () => {
  it('returns first and last day of month', () => {
    const mid = parseUtcDateOnly('2026-02-10')!
    expect(formatUtcDateOnly(firstDayOfUtcCalendarMonth(mid))).toBe('2026-02-01')
    expect(formatUtcDateOnly(lastDayOfUtcCalendarMonth(mid))).toBe('2026-02-28')
  })
})
