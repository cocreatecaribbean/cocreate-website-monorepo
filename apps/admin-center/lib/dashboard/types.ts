export type AdminDashboardStats = {
  activeClients: number
  activeClientsThisMonth: number
  openProjects: number
  projectsAwaitingApproval: number
  portalInvites: number
  socialListeningSubscribers: number
  socialListeningConfigured: number
}

export type AdminRecentActivityItem = {
  id: string
  projectId: string
  projectTitle: string
  organizationId: string
  organizationName: string
  action: string
  summary?: string
  actorEmail: string | null
  actorName?: string | null
  actorJobTitle?: string | null
  actorLabel?: string | null
  createdAt: string
  href: string
}
