import {
  aggregateMentionMatrixByWeek,
  aggregateSentimentOverTimeByWeek,
  aggregateSnapshotsByCalendarMonth,
  buildMonthlyChartViews,
  buildMonthlyTrendPoints,
  enumerateCalendarWeeksInPeriod,
  resolvePeriodBounds,
} from './monthly-period-charts'

describe('enumerateCalendarWeeksInPeriod', () => {
  it('splits a full calendar month into day-range week buckets', () => {
    const weeks = enumerateCalendarWeeksInPeriod('2026-06-01', '2026-06-30')
    expect(weeks).toHaveLength(5)
    expect(weeks[0]).toMatchObject({
      startDate: '2026-06-01',
      endDate: '2026-06-07',
      label: 'Jun 1–7',
    })
    expect(weeks[4]).toMatchObject({
      startDate: '2026-06-29',
      endDate: '2026-06-30',
    })
  })

  it('falls back to rolling 7-day buckets for non-month periods', () => {
    const weeks = enumerateCalendarWeeksInPeriod('2026-06-09', '2026-06-22')
    expect(weeks.length).toBeGreaterThanOrEqual(2)
    expect(weeks[0]?.startDate).toBe('2026-06-09')
  })
})

describe('aggregateSentimentOverTimeByWeek', () => {
  it('aggregates daily rows into weekly totals', () => {
    const daily = [
      { date: '2026-06-01', positive: 10, neutral: 5, negative: 1 },
      { date: '2026-06-02', positive: 8, neutral: 4, negative: 2 },
      { date: '2026-06-08', positive: 3, neutral: 6, negative: 1 },
    ]

    const weekly = aggregateSentimentOverTimeByWeek(daily, {
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
    })

    expect(weekly).toHaveLength(5)
    expect(weekly[0]).toEqual({
      date: '2026-06-01',
      positive: 18,
      neutral: 9,
      negative: 3,
    })
    expect(weekly[1]).toEqual({
      date: '2026-06-08',
      positive: 3,
      neutral: 6,
      negative: 1,
    })
  })

  it('passes through already-weekly rows', () => {
    const weekly = [
      { date: 'Week 1', positive: 10, neutral: 5, negative: 1 },
      { date: 'Week 2', positive: 8, neutral: 4, negative: 2 },
    ]

    expect(
      aggregateSentimentOverTimeByWeek(weekly, {
        periodStart: '2026-06-01',
        periodEnd: '2026-06-30',
      }),
    ).toEqual(weekly)
  })
})

describe('aggregateMentionMatrixByWeek', () => {
  it('replaces weekday rows with weekly buckets', () => {
    const matrix = [
      {
        id: 'Monday',
        data: [
          { x: '12am-6am', y: 10 },
          { x: '6am-12pm', y: 20 },
          { x: '12pm-6pm', y: 30 },
          { x: '6pm-12am', y: 40 },
        ],
      },
      {
        id: 'Tuesday',
        data: [
          { x: '12am-6am', y: 11 },
          { x: '6am-12pm', y: 21 },
          { x: '12pm-6pm', y: 31 },
          { x: '6pm-12am', y: 41 },
        ],
      },
    ]

    const weekly = aggregateMentionMatrixByWeek(matrix, {
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
    })

    expect(weekly.every((row) => !row.id.startsWith('Mon'))).toBe(true)
    expect(weekly[0]?.data).toHaveLength(4)
  })
})

describe('buildMonthlyTrendPoints', () => {
  it('sorts chronologically and formats month labels', () => {
    const points = buildMonthlyTrendPoints([
      {
        date: '2026-07-31',
        periodStart: '2026-07-01T00:00:00.000Z',
        periodEnd: '2026-07-31T23:59:59.999Z',
        totalMentions: 900,
      },
      {
        date: '2026-06-30',
        periodStart: '2026-06-01T00:00:00.000Z',
        periodEnd: '2026-06-30T23:59:59.999Z',
        totalMentions: 700,
      },
    ])

    expect(points).toEqual([
      {
        monthKey: '2026-06',
        monthLabel: 'Jun 2026',
        periodLabel: 'Jun 1 – Jun 30, 2026',
        totalMentions: 700,
        snapshotDate: '2026-06-30',
      },
      {
        monthKey: '2026-07',
        monthLabel: 'Jul 2026',
        periodLabel: 'Jul 1 – Jul 31, 2026',
        totalMentions: 900,
        snapshotDate: '2026-07-31',
      },
    ])
  })

  it('dedupes multiple legacy snapshots in the same month to one bar', () => {
    const points = aggregateSnapshotsByCalendarMonth([
      {
        date: '2026-05-05',
        periodStart: '2026-05-01T00:00:00.000Z',
        periodEnd: '2026-05-05T23:59:59.999Z',
        totalMentions: 400,
      },
      {
        date: '2026-05-12',
        periodStart: '2026-05-01T00:00:00.000Z',
        periodEnd: '2026-05-12T23:59:59.999Z',
        totalMentions: 500,
      },
      {
        date: '2026-05-19',
        periodStart: '2026-05-01T00:00:00.000Z',
        periodEnd: '2026-05-19T23:59:59.999Z',
        totalMentions: 600,
      },
      {
        date: '2026-05-26',
        periodStart: '2026-05-01T00:00:00.000Z',
        periodEnd: '2026-05-26T23:59:59.999Z',
        totalMentions: 700,
      },
      {
        date: '2026-05-31',
        periodStart: '2026-05-01T00:00:00.000Z',
        periodEnd: '2026-05-31T23:59:59.999Z',
        totalMentions: 1200,
      },
    ])

    expect(points).toHaveLength(1)
    expect(points[0]).toMatchObject({
      monthKey: '2026-05',
      monthLabel: 'May 2026',
      totalMentions: 1200,
      snapshotDate: '2026-05-31',
    })
  })

  it('prefers full calendar-month snapshots over legacy rolling windows', () => {
    const points = aggregateSnapshotsByCalendarMonth([
      {
        date: '2026-06-28',
        periodStart: '2026-06-01T00:00:00.000Z',
        periodEnd: '2026-06-28T23:59:59.999Z',
        totalMentions: 999,
      },
      {
        date: '2026-06-30',
        periodStart: '2026-06-01T00:00:00.000Z',
        periodEnd: '2026-06-30T23:59:59.999Z',
        totalMentions: 850,
      },
    ])

    expect(points).toHaveLength(1)
    expect(points[0]?.totalMentions).toBe(850)
    expect(points[0]?.snapshotDate).toBe('2026-06-30')
  })

  it('caps output to the 12 most recent months', () => {
    const points = aggregateSnapshotsByCalendarMonth(
      Array.from({ length: 15 }, (_, index) => {
        const year = 2024 + Math.floor(index / 12)
        const month = (index % 12) + 1
        const monthKey = String(month).padStart(2, '0')
        const lastDay = month === 2 ? 28 : 30
        return {
          date: `${year}-${monthKey}-${lastDay}`,
          periodStart: `${year}-${monthKey}-01T00:00:00.000Z`,
          periodEnd: `${year}-${monthKey}-${lastDay}T23:59:59.999Z`,
          totalMentions: 100 + index,
        }
      }),
    )

    expect(points).toHaveLength(12)
    expect(points[0]?.monthKey).toBe('2024-04')
    expect(points[11]?.monthKey).toBe('2025-03')
  })
})

describe('buildMonthlyChartViews', () => {
  it('applies weekly aggregation using provided period bounds', () => {
    const views = buildMonthlyChartViews(
      {
        sentimentSummary: [],
        sentimentOverTime: [
          { date: '2026-06-01', positive: 1, neutral: 2, negative: 0 },
          { date: '2026-06-02', positive: 2, neutral: 1, negative: 1 },
        ],
        sourceBreakdown: [],
        reachVsEngagement: [
          {
            id: 'Social Reach (Thousands)',
            data: [
              { x: 'Jun 1', y: 10 },
              { x: 'Jun 2', y: 20 },
            ],
          },
          {
            id: 'Engagement Volume',
            data: [
              { x: 'Jun 1', y: 1 },
              { x: 'Jun 2', y: 2 },
            ],
          },
        ],
        mentionMatrix: [
          {
            id: 'Monday',
            data: [
              { x: '12am-6am', y: 1 },
              { x: '6am-12pm', y: 2 },
              { x: '12pm-6pm', y: 3 },
              { x: '6pm-12am', y: 4 },
            ],
          },
        ],
      },
      {
        periodStart: '2026-06-01T00:00:00.000Z',
        periodEnd: '2026-06-30T23:59:59.999Z',
      },
    )

    expect(views.sentimentOverTime[0]?.positive).toBe(3)
    expect(views.reachVsEngagement[0]?.data.length).toBeGreaterThan(0)
    expect(views.mentionMatrix[0]?.id).toContain('Jun')
  })
})

describe('resolvePeriodBounds', () => {
  it('prefers explicit period bounds', () => {
    expect(
      resolvePeriodBounds({
        periodStart: '2026-06-01T00:00:00.000Z',
        periodEnd: '2026-06-30T23:59:59.999Z',
      }),
    ).toEqual({
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
    })
  })
})
