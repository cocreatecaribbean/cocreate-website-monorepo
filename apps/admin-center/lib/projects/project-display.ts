import type { ClientProjectStatus } from '@/lib/projects/types'

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
      return 'bg-casablanca/25 text-chambray ring-casablanca/25'
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
    case 'COMPLETED':
      return 'bg-sanmarino/15 text-sanmarino ring-sanmarino/25'
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
  name: string | null | undefined
  jobTitle?: string | null | undefined
  email: string | null | undefined
  at: string | null | undefined
}): string | null {
  if (!params.at) return null
  const who = formatActorWithTitle(params.name, params.jobTitle, params.email)
  if (!who) return null
  return `${params.verb} by ${who} · ${new Date(params.at).toLocaleString()}`
}

export function formatTimelineActor(
  name: string | null | undefined,
  jobTitle: string | null | undefined,
  email: string | null | undefined,
): string {
  return formatActorWithTitle(name, jobTitle, email) ?? email ?? 'Someone'
}
