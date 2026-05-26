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

export type ClientProjectSummary = {
  id: string
  organizationId: string
  organizationName: string | null
  title: string
  description: string
  status: ClientProjectStatus
  phase: ClientProjectPhase
  createdByEmail: string | null
  approvedAt: string | null
  approvedByEmail?: string | null
  approvedByName?: string | null
  approvedByJobTitle?: string | null
  statusLabel?: string
  completedByEmail?: string | null
  completedByName?: string | null
  completedByJobTitle?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt: string
  openAdminReviewCount?: number
  hasOpenAdminReview?: boolean
  requests?: ProjectRequestItem[]
  activities?: ProjectActivityItem[]
}

export type ProjectRequestItem = {
  id: string
  projectId: string
  projectTitle: string | null
  organizationId: string | null
  organizationName: string | null
  type: ProjectRequestType
  status: ProjectRequestStatus
  title: string
  description: string
  targetPhase: ClientProjectPhase | null
  createdByEmail: string | null
  createdAt: string
  messages?: ProjectRequestMessage[]
  messageCount?: number
}

export type ProjectActivityItem = {
  id: string
  projectId: string
  projectTitle: string
  action: string
  actorEmail: string
  actorName?: string | null
  actorJobTitle?: string | null
  actorLabel?: string | null
  summary?: string
  createdAt: string
}
