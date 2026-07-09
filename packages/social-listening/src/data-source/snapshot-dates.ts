export type SocialListeningSnapshotDateEntry = {
  date: string
  periodStart: string
  periodEnd: string
  source: 'brand24' | 'org_mock'
  totalMentions?: number
}

export type SocialListeningSnapshotDatesResult = {
  organizationId: string
  organizationName?: string
  snapshots: SocialListeningSnapshotDateEntry[]
  /** Convenience list of date strings (newest first) */
  dates: string[]
}

export function formatSnapshotPeriod(entry: SocialListeningSnapshotDateEntry): string {
  const start = entry.periodStart.slice(0, 10)
  const end = entry.periodEnd.slice(0, 10)
  return start === end ? start : `${start} – ${end}`
}

/** Dropdown label for a snapshot — period range only (end date is not duplicated). */
export function formatSnapshotOptionLabel(entry: SocialListeningSnapshotDateEntry): string {
  return formatSnapshotPeriod(entry)
}

export type SocialListeningDataSourceLabel =
  | 'live'
  | 'demo'
  | 'mock'

export function resolveDataSourceLabel(
  source: 'brand24' | 'org_mock',
  isDemoSnapshots?: boolean,
): { label: SocialListeningDataSourceLabel; title: string } {
  if (source === 'brand24') {
    return { label: 'live', title: 'Live · Brand24' }
  }
  if (isDemoSnapshots) {
    return { label: 'demo', title: 'Demo sample · org-scoped' }
  }
  return { label: 'mock', title: 'Mock · awaiting Brand24' }
}
