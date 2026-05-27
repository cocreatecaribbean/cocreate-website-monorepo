import { adminApiHeaders } from '@/lib/admin-api-headers'
import type { AdminDashboardStats } from '@/lib/dashboard/types'

const apiBase = () =>
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const emptyStats: AdminDashboardStats = {
  activeClients: 0,
  activeClientsThisMonth: 0,
  openProjects: 0,
  projectsAwaitingApproval: 0,
  portalInvites: 0,
  socialListeningSubscribers: 0,
  socialListeningConfigured: 0,
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const headers = await adminApiHeaders(true)
  if (!headers) return emptyStats

  try {
    const response = await fetch(`${apiBase()}/admin/dashboard/stats`, {
      headers,
      cache: 'no-store',
    })
    if (!response.ok) return emptyStats
    return (await response.json()) as AdminDashboardStats
  } catch {
    return emptyStats
  }
}

export function buildAdminDashboardKpis(stats: AdminDashboardStats) {
  const clientsChange =
    stats.activeClientsThisMonth > 0
      ? `+${stats.activeClientsThisMonth} this month`
      : 'No new clients this month'

  const openProjectsHint =
    stats.projectsAwaitingApproval > 0
      ? `${stats.projectsAwaitingApproval} awaiting approval`
      : 'None awaiting approval'

  const invitesHint =
    stats.portalInvites > 0
      ? `${stats.portalInvites} pending sign-in`
      : 'No pending invites'

  const socialHint =
    stats.socialListeningConfigured > 0
      ? `${stats.socialListeningConfigured} configured for analytics`
      : stats.socialListeningSubscribers > 0
        ? 'Enable Brand24 project IDs'
        : 'No subscribers yet'

  return [
    {
      label: 'Active clients',
      value: String(stats.activeClients),
      change: clientsChange,
    },
    {
      label: 'Open projects',
      value: String(stats.openProjects),
      change: openProjectsHint,
    },
    {
      label: 'Portal invites',
      value: String(stats.portalInvites),
      change: invitesHint,
    },
    {
      label: 'Social listening',
      value: String(stats.socialListeningSubscribers),
      change: socialHint,
    },
  ] as const
}
