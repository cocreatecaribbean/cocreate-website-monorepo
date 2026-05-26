export type MentionSnapshotHint = {
  mentionsLine: string
  dateLine?: string
}

export function buildMentionSnapshotHint(
  totalMentions: number,
  snapshotDate?: string | null,
): MentionSnapshotHint | undefined {
  if (totalMentions <= 0) return undefined
  const count = totalMentions.toLocaleString()
  if (snapshotDate) {
    return {
      mentionsLine: `${count} mentions in snapshot`,
      dateLine: snapshotDate,
    }
  }
  return { mentionsLine: `${count} total mentions in period` }
}
