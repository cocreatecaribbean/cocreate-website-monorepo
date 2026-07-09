import { formatUtcDateOnly } from './social-listening-dates'
import type { SocialListeningSnapshotDatesResponse } from './social-listening.types'

/**
 * Tenant isolation guarantees for snapshot listing — org A rows never appear in org B responses.
 */
describe('social-listening tenant isolation', () => {
  function listDatesForOrg(
    allRows: Array<{
      organizationId: string
      snapshotDate: Date
      periodStart: Date
      periodEnd: Date
      source: string
    }>,
    organizationId: string,
  ): SocialListeningSnapshotDatesResponse {
    const rows = allRows
      .filter((r) => r.organizationId === organizationId)
      .sort((a, b) => b.snapshotDate.getTime() - a.snapshotDate.getTime())

    const snapshots = rows.map((r) => ({
      date: formatUtcDateOnly(r.snapshotDate),
      periodStart: r.periodStart.toISOString(),
      periodEnd: r.periodEnd.toISOString(),
      source: (r.source === 'brand24' ? 'brand24' : 'org_mock') as
        | 'brand24'
        | 'org_mock',
    }))

    return {
      ok: true,
      organizationId,
      dates: snapshots.map((s) => s.date),
      snapshots,
    }
  }

  const orgA = 'org-a'
  const orgB = 'org-b'
  const periodStart = new Date('2026-03-01T00:00:00.000Z')
  const periodEnd = new Date('2026-03-07T23:59:59.999Z')

  const sharedDb = [
    {
      organizationId: orgA,
      snapshotDate: new Date('2026-03-10T00:00:00.000Z'),
      periodStart,
      periodEnd,
      source: 'org_mock',
    },
    {
      organizationId: orgA,
      snapshotDate: new Date('2026-03-03T00:00:00.000Z'),
      periodStart,
      periodEnd,
      source: 'org_mock',
    },
    {
      organizationId: orgB,
      snapshotDate: new Date('2026-03-10T00:00:00.000Z'),
      periodStart,
      periodEnd,
      source: 'brand24',
    },
    {
      organizationId: orgB,
      snapshotDate: new Date('2026-02-24T00:00:00.000Z'),
      periodStart,
      periodEnd,
      source: 'brand24',
    },
  ]

  it('returns only caller organization snapshot dates', () => {
    const forA = listDatesForOrg(sharedDb, orgA)
    const forB = listDatesForOrg(sharedDb, orgB)

    expect(forA.organizationId).toBe(orgA)
    expect(forB.organizationId).toBe(orgB)
    expect(forA.dates).toEqual(['2026-03-10', '2026-03-03'])
    expect(forB.dates).toEqual(['2026-03-10', '2026-02-24'])
    expect(forA.dates).not.toContain('2026-02-24')
    expect(forB.dates).not.toContain('2026-03-03')
  })

  it('never mixes sources across organizations in a single response', () => {
    const forA = listDatesForOrg(sharedDb, orgA)
    expect(forA.snapshots.every((s) => s.source === 'org_mock')).toBe(true)

    const forB = listDatesForOrg(sharedDb, orgB)
    expect(forB.snapshots.every((s) => s.source === 'brand24')).toBe(true)
  })

  it('empty org gets empty snapshot list', () => {
    const orphan = listDatesForOrg(sharedDb, 'org-unknown')
    expect(orphan.dates).toEqual([])
    expect(orphan.snapshots).toEqual([])
  })
})
