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
    case 'project.created_by_admin':
      return `${who} created this project`
    case 'project.approved':
      return `${who} onboarded this project`
    case 'project.completed':
      return `${who} marked this project complete`
    case 'project.updated':
      return `${who} updated the project`
    case 'project.renamed': {
      const previous =
        typeof metadata?.previousTitle === 'string' && metadata.previousTitle.trim()
          ? metadata.previousTitle.trim()
          : null
      const next =
        typeof metadata?.title === 'string' && metadata.title.trim()
          ? metadata.title.trim()
          : null
      if (previous && next) {
        return `${who} renamed “${previous}” to “${next}”`
      }
      if (next) {
        return `${who} renamed this project to “${next}”`
      }
      return `${who} renamed this project`
    }
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
    case 'request.cancellation_requested':
      return 'Client requested project cancellation'
    case 'cover.updated':
      return metadata?.removed ? `${who} removed the project cover` : `${who} updated the project cover`
    default:
      return `${who}: ${action}`
  }
}

/** High-signal workspace events for admin dashboard feed (excludes routine chat). */
export const RECENT_ACTIVITY_ACTIONS = [
  'project.submitted',
  'project.approved',
  'project.completed',
  'project.updated',
  'project.renamed',
  'request.cancellation_requested',
  'request.updated',
  'attachment.uploaded',
] as const

export function getActivityHref(
  action: string,
  organizationId: string,
  metadata?: Record<string, unknown> | null,
): string {
  const base = `/clients/${organizationId}`
  const requestId =
    typeof metadata?.requestId === 'string' && metadata.requestId.length > 0
      ? metadata.requestId
      : null

  if (
    action === 'project.submitted' ||
    action === 'project.created_by_admin' ||
    action === 'project.renamed'
  ) {
    return `${base}?tab=projects`
  }

  const threadActions = new Set([
    'request.cancellation_requested',
    'request.updated',
    'attachment.uploaded',
  ])
  if (requestId && (threadActions.has(action) || action.startsWith('request.'))) {
    return `${base}?tab=projects&thread=${requestId}`
  }

  return `${base}?tab=activity`
}

/** High-signal events for client portal dashboard (excludes routine chat / internal admin noise). */
export const CLIENT_RECENT_ACTIVITY_ACTIONS = [
  'project.created_by_admin',
  'project.approved',
  'project.completed',
  'project.submitted',
  'project.renamed',
  'attachment.uploaded',
] as const

export function getClientActivitySummary(
  action: string,
  actorLabel: string,
  metadata?: Record<string, unknown> | null,
): string {
  const team = 'CoCreate team'
  const who = actorLabel && actorLabel !== 'Someone' ? actorLabel : team
  switch (action) {
    case 'project.submitted':
      return 'Project submitted for agency review'
    case 'project.created_by_admin':
      return `${team} added a new project for you`
    case 'project.approved':
      return 'Your project was onboarded and is active'
    case 'project.completed':
      return `${team} marked this project complete`
    case 'project.renamed': {
      const previous =
        typeof metadata?.previousTitle === 'string' && metadata.previousTitle.trim()
          ? metadata.previousTitle.trim()
          : null
      const next =
        typeof metadata?.title === 'string' && metadata.title.trim()
          ? metadata.title.trim()
          : null
      if (previous && next) {
        return `${who} renamed “${previous}” to “${next}”`
      }
      if (next) {
        return `${who} renamed this project to “${next}”`
      }
      return `${who} renamed this project`
    }
    case 'attachment.uploaded':
      return `${who} shared a file on this project`
    default:
      return getActivitySummary(action, who, metadata)
  }
}

export function getClientActivityHref(
  action: string,
  projectId: string,
  metadata?: Record<string, unknown> | null,
): string {
  return `/?ccView=projects&projectId=${encodeURIComponent(projectId)}`
}
