import {
  enumerateUtcDatesInclusive,
  enumerateUtcMonthlySnapshotDates,
  validateListeningSetupDateRange,
} from './social-listening-setup-dates'
import { formatUtcDateOnly } from './social-listening-dates'

describe('social-listening-setup-dates', () => {
  it('enumerates every calendar day inclusively', () => {
    const start = new Date('2026-01-01T00:00:00.000Z')
    const end = new Date('2026-01-05T00:00:00.000Z')
    const dates = enumerateUtcDatesInclusive(start, end)
    expect(dates.map(formatUtcDateOnly)).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
      '2026-01-04',
      '2026-01-05',
    ])
  })

  it('enumerates monthly snapshot dates as last day of each complete month in range', () => {
    const start = new Date('2026-01-15T00:00:00.000Z')
    const end = new Date('2026-03-31T00:00:00.000Z')
    const dates = enumerateUtcMonthlySnapshotDates(start, end)
    expect(dates.map(formatUtcDateOnly)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31'])
  })

  it('skips incomplete trailing month when range ends mid-month', () => {
    const start = new Date('2026-01-01T00:00:00.000Z')
    const end = new Date('2026-04-08T00:00:00.000Z')
    const monthly = enumerateUtcMonthlySnapshotDates(start, end)
    expect(monthly.map(formatUtcDateOnly)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31'])
    expect(monthly.length).toBeLessThanOrEqual(4)
    expect(monthly.length).toBeGreaterThanOrEqual(2)
  })

  it('validates setup date range', () => {
    const today = formatUtcDateOnly(new Date())
    const start = new Date(today)
    start.setUTCDate(start.getUTCDate() - 30)
    const { start: parsedStart, end: parsedEnd } = validateListeningSetupDateRange(
      formatUtcDateOnly(start),
      today,
    )
    expect(parsedStart <= parsedEnd).toBe(true)
  })
})
