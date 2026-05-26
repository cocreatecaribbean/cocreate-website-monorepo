import type { ClientProjectStatus } from '@cocreate/database'

/** Client-facing status copy (internal enum stays SUBMITTED / ACTIVE / etc.). */
export function getClientProjectStatusLabel(status: ClientProjectStatus): string {
  switch (status) {
    case 'SUBMITTED':
      return 'Submitted — awaiting review'
    case 'ACTIVE':
      return 'Onboarded'
    case 'COMPLETED':
      return 'Completed'
    case 'ON_HOLD':
      return 'On hold'
    case 'CANCELLED':
      return 'Cancelled'
    default:
      return status
  }
}

export function formatActorEmail(email: string | null | undefined): string | null {
  if (!email) return null
  const local = email.split('@')[0]?.replace(/[._-]/g, ' ').trim()
  if (!local) return email
  return local
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

export function getActivitySummary(
  action: string,
  actorLabel: string,
  metadata?: Record<string, unknown> | null,
): string {
  const who = actorLabel || 'Someone'
  switch (action) {
    case 'project.submitted':
      return 'Project submitted for agency review'
    case 'project.approved':
      return `${who} onboarded this project`
    case 'project.completed':
      return `${who} marked this project complete`
    case 'project.updated':
      return `${who} updated the project`
    case 'request.admin_review':
      return `${who} requested client review`
    case 'request.change_created':
      return 'Client submitted a change request'
    case 'request.phase_approval':
      return 'Client requested phase approval'
    case 'request.message':
      return `${who} sent a message`
    case 'request.updated':
      return `${who} updated a request (${String(metadata?.status ?? 'updated')})`
    case 'attachment.uploaded':
      return `${who} uploaded a file`
    default:
      return `${who}: ${action}`
  }
}
