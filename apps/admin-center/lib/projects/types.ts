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

export type ProjectRequestType = 'ONBOARDING' | 'PROGRESS' | 'CANCELLATION'

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
  messageKind?: 'CHAT' | 'CHECKPOINT'
  checkpointTargetPhase?: ClientProjectPhase | null
  requiresClientApproval?: boolean
  clientApprovedAt?: string | null
  supersededAt?: string | null
  isPendingApproval?: boolean
  createdAt: string
  attachmentIds?: string[]
  attachments?: ProjectAttachment[]
}

export type ProjectAttachmentWithUsage = ProjectAttachment & {
  usedInThreads: boolean
  messageRefsCount: number
  lastUsedAt: string | null
}

export type ProjectFilesGroup = {
  projectId: string
  projectTitle: string
  libraryUploads: ProjectAttachmentWithUsage[]
  usedInThreads: ProjectAttachmentWithUsage[]
}

export type ClientFilesLibrary = {
  projects: ProjectFilesGroup[]
  files?: Array<ProjectAttachmentWithUsage & { projectTitle: string }>
  nextCursor?: string | null
}

export type FilesQuery = {
  projectId?: string
  q?: string
  cursor?: string
  limit?: number
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
  coverImageUrl?: string | null
  pendingCheckpointCount?: number
  hasPendingCheckpoint?: boolean
  openAdminReviewCount?: number
  hasOpenAdminReview?: boolean
  openCancellationCount?: number
  hasOpenCancellation?: boolean
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
  cancellationOutcome?: string | null
  cancellationFeeAmount?: number | null
  cancellationFeeNotes?: string | null
  createdByEmail: string | null
  createdAt: string
  messages?: ProjectRequestMessage[]
  attachments?: ProjectAttachment[]
  messageCount?: number
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
