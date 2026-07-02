import type { ClientDashboardStats } from '@/lib/projects/api-types'

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`
}

export function formatRelativeUploadTime(iso: string | null): string {
  if (!iso) return 'No uploads yet'

  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return 'No uploads yet'

  const now = new Date()
  const diffMs = now.getTime() - then.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'Last upload today'
  if (diffDays === 1) return 'Last upload yesterday'
  if (diffDays < 7) return `Last upload ${diffDays} days ago`
  if (diffDays < 14) return 'Last upload 1 week ago'
  return `Last upload ${Math.floor(diffDays / 7)} weeks ago`
}

export function buildClientDashboardKpis(stats: ClientDashboardStats) {
  const activeHint =
    stats.activeProjectsAwaitingReview > 0
      ? `${pluralize(stats.activeProjectsAwaitingReview, 'project')} awaiting your review`
      : stats.activeProjects > 0
        ? 'No checkpoints pending'
        : 'Submit a project to get started'

  const approvalsHint =
    stats.pendingApprovals > 0
      ? stats.pendingApprovals === 1
        ? '1 file to review'
        : `${stats.pendingApprovals} files to review`
      : 'All caught up'

  const filesHint = formatRelativeUploadTime(stats.lastSharedFileAt)

  return [
    {
      label: 'Active projects',
      value: String(stats.activeProjects),
      hint: activeHint,
    },
    {
      label: 'Pending approvals',
      value: String(stats.pendingApprovals),
      hint: approvalsHint,
    },
    {
      label: 'Shared files',
      value: String(stats.sharedFiles),
      hint: filesHint,
    },
  ] as const
}
