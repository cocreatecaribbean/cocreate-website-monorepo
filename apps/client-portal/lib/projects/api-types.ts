export type ClientProjectStatus =
  | 'SUBMITTED'
  | 'ACTIVE'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED'

export type ClientProjectPhase =
  | 'DISCOVERY'
  | 'IN_PROGRESS'
  | 'CLIENT_REVIEW'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED'

export type ProjectRequestType = 'CHANGE_REQUEST' | 'PHASE_APPROVAL' | 'ADMIN_REVIEW'

export type ProjectRequestStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED'
  | 'CANCELLED'

export type ProjectRequestMessage = {
  id: string
  requestId: string
  authorUserId: string
  authorEmail: string | null
  authorDisplayName?: string | null
  authorJobTitle?: string | null
  authorRole: 'ADMIN' | 'CLIENT'
  body: string
  createdAt: string
}

export type ProjectActivity = {
  id: string
  action: string
  actorEmail: string | null
  actorName: string | null
  actorJobTitle?: string | null
  actorLabel?: string | null
  summary: string
  createdAt: string
}

export type ClientProjectSummary = {
  id: string
  organizationId: string
  title: string
  description: string
  status: ClientProjectStatus
  statusLabel?: string
  phase: ClientProjectPhase
  approvedByEmail?: string | null
  approvedByName?: string | null
  approvedByJobTitle?: string | null
  approvedAt?: string | null
  completedByEmail?: string | null
  completedByName?: string | null
  completedByJobTitle?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt: string
  openAdminReviewCount?: number
  hasOpenAdminReview?: boolean
  activities?: ProjectActivity[]
}

export type ProjectAttachment = {
  id: string
  projectId: string
  requestId: string | null
  fileName: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

export type ProjectRequestItem = {
  id: string
  projectId: string
  projectTitle?: string | null
  type: ProjectRequestType
  status: ProjectRequestStatus
  title: string
  description: string
  targetPhase: ClientProjectPhase | null
  createdAt: string
  messages?: ProjectRequestMessage[]
  messageCount?: number
}

export type ClientProjectDetail = ClientProjectSummary & {
  requests?: ProjectRequestItem[]
  attachments?: ProjectAttachment[]
  activities?: ProjectActivity[]
}

export type PortalNotificationItem = {
  id: string
  type: string
  title: string
  body: string
  href: string | null
  readAt: string | null
  projectId: string | null
  requestId: string | null
  createdAt: string
}
