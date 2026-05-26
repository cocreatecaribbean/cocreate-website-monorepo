import type { ClientProjectStatus } from '@/lib/projects/api-types'

/** Prefer API statusLabel; fallback for older responses. */
export function getProjectStatusLabel(
  status: ClientProjectStatus,
  statusLabel?: string,
): string {
  if (statusLabel) return statusLabel
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

export function getProjectStatusTone(status: ClientProjectStatus): string {
  switch (status) {
    case 'SUBMITTED':
      return 'bg-casablanca/20 text-chambray ring-casablanca/30'
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-200/80 dark:bg-casablanca/20 dark:text-casablanca dark:ring-casablanca/35'
    case 'COMPLETED':
      return 'bg-sanmarino/15 text-sanmarino ring-sanmarino/25'
    case 'CANCELLED':
      return 'bg-red-50 text-red-800 ring-red-200/60'
    default:
      return 'bg-slate-100 text-slate-600 ring-slate-200'
  }
}

export function formatActorWithTitle(
  name: string | null | undefined,
  jobTitle: string | null | undefined,
  email: string | null | undefined,
): string | null {
  const who = name?.trim() || email
  if (!who) return null
  const title = jobTitle?.trim()
  return title ? `${who} · ${title}` : who
}

export function formatAttributionLine(params: {
  verb: string
  name: string | null
  jobTitle?: string | null
  email: string | null
  at: string | null
}): string | null {
  if (!params.at) return null
  const who = formatActorWithTitle(params.name, params.jobTitle, params.email)
  if (!who) return null
  const date = new Date(params.at).toLocaleString()
  return `${params.verb} by ${who} · ${date}`
}

export function formatTimelineActor(
  name: string | null | undefined,
  jobTitle: string | null | undefined,
  email: string | null | undefined,
): string {
  return formatActorWithTitle(name, jobTitle, email) ?? email ?? 'Someone'
}
