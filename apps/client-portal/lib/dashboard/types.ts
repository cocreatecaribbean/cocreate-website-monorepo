export type ClientRecentActivityItem = {
  id: string
  projectId: string
  projectTitle: string
  action: string
  summary?: string
  actorEmail: string | null
  actorName?: string | null
  actorLabel?: string | null
  createdAt: string
  href: string
}
