import {
  formatSnapshotOptionLabel,
  type SocialListeningSnapshotDateEntry,
} from './snapshot-dates'

describe('formatSnapshotOptionLabel', () => {
  it('shows period range only, not triple date', () => {
    const entry: SocialListeningSnapshotDateEntry = {
      date: '2026-07-08',
      periodStart: '2026-06-09T00:00:00.000Z',
      periodEnd: '2026-07-08T23:59:59.999Z',
      source: 'org_mock',
    }

    expect(formatSnapshotOptionLabel(entry)).toBe('2026-06-09 – 2026-07-08')
    expect(formatSnapshotOptionLabel(entry)).not.toMatch(/^2026-07-08 ·/)
  })

  it('collapses same-day period to a single date', () => {
    const entry: SocialListeningSnapshotDateEntry = {
      date: '2026-07-08',
      periodStart: '2026-07-08T00:00:00.000Z',
      periodEnd: '2026-07-08T23:59:59.999Z',
      source: 'brand24',
    }

    expect(formatSnapshotOptionLabel(entry)).toBe('2026-07-08')
  })
})
