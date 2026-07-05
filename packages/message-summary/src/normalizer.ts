import { formatMessageTimestamp } from './format-date'

export type NormalizedAttachment = {
  id: string
  fileName: string
  mimeType: string
  isImage: boolean
}

export type NormalizedThreadMessage = {
  id: string
  author: string
  role: string
  timestamp: string
  body: string
  attachments: NormalizedAttachment[]
  checkpoint?: {
    targetPhase: string | null
    requiresClientApproval: boolean
    clientApprovedAt: string | null
    superseded: boolean
  }
}

export type AttachmentInput = {
  id: string
  fileName: string
  mimeType: string
}

export type ProjectMessageInput = {
  id: string
  authorDisplayName?: string | null
  authorEmail?: string | null
  authorRole: string
  body: string
  createdAt: string
  messageKind?: string
  checkpointTargetPhase?: string | null
  requiresClientApproval?: boolean
  clientApprovedAt?: string | null
  supersededAt?: string | null
  attachments?: AttachmentInput[]
}

export type OrgInboxMessageInput = {
  id: string
  authorEmail: string
  authorRole: string
  body: string
  createdAt: string
  attachments?: AttachmentInput[]
}

const PHASE_LABELS: Record<string, string> = {
  DISCOVERY: 'Discovery',
  IN_PROGRESS: 'In Progress',
  CLIENT_REVIEW: 'Client Review',
  READY_FOR_DELIVERY: 'Ready for Delivery',
  DELIVERED: 'Delivered',
}

function displayAuthor(name?: string | null, email?: string | null): string {
  const trimmed = name?.trim()
  if (trimmed) return trimmed
  if (email) return email.split('@')[0] ?? email
  return 'Unknown'
}

function formatPhaseLabel(phase: string | null): string {
  if (!phase) return 'n/a'
  return PHASE_LABELS[phase] ?? phase
}

function normalizeAttachments(
  attachments?: AttachmentInput[],
): NormalizedAttachment[] {
  return (
    attachments?.map((attachment) => ({
      id: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      isImage: attachment.mimeType.startsWith('image/'),
    })) ?? []
  )
}

export function normalizeProjectMessages(
  messages: ProjectMessageInput[],
): NormalizedThreadMessage[] {
  return messages.map((message) => ({
    id: message.id,
    author: displayAuthor(message.authorDisplayName, message.authorEmail),
    role: message.authorRole,
    timestamp: message.createdAt,
    body: message.body,
    attachments: normalizeAttachments(message.attachments),
    ...(message.messageKind === 'CHECKPOINT'
      ? {
          checkpoint: {
            targetPhase: message.checkpointTargetPhase ?? null,
            requiresClientApproval: message.requiresClientApproval ?? false,
            clientApprovedAt: message.clientApprovedAt ?? null,
            superseded: Boolean(message.supersededAt),
          },
        }
      : {}),
  }))
}

export function normalizeOrgInboxMessages(
  messages: OrgInboxMessageInput[],
): NormalizedThreadMessage[] {
  return messages.map((message) => ({
    id: message.id,
    author: displayAuthor(null, message.authorEmail),
    role: message.authorRole,
    timestamp: message.createdAt,
    body: message.body,
    attachments: normalizeAttachments(message.attachments),
  }))
}

function formatAttachmentCatalogLine(attachments: NormalizedAttachment[]): string {
  if (attachments.length === 0) return ''

  const lines = attachments.map(
    (attachment) =>
      `[id=${attachment.id}] ${attachment.fileName} (${attachment.mimeType})${attachment.isImage ? ' [image]' : ''}`,
  )
  return `\nAttachments:\n${lines.map((line) => `  - ${line}`).join('\n')}`
}

export function formatGlobalAttachmentCatalog(
  messages: NormalizedThreadMessage[],
): string {
  const entries: NormalizedAttachment[] = []
  const seen = new Set<string>()

  for (const message of messages) {
    for (const attachment of message.attachments) {
      if (seen.has(attachment.id)) continue
      seen.add(attachment.id)
      entries.push(attachment)
    }
  }

  if (entries.length === 0) return ''

  const lines = entries.map(
    (attachment) =>
      `- [id=${attachment.id}] ${attachment.fileName} (${attachment.mimeType})${attachment.isImage ? ' [image]' : ''}`,
  )

  return `Attachment catalog (use exact id values in referencedFiles):\n${lines.join('\n')}`
}

export function formatMessagesForPrompt(
  messages: NormalizedThreadMessage[],
): string {
  return messages
    .map((message) => {
      const attachments = formatAttachmentCatalogLine(message.attachments)
      const checkpoint = message.checkpoint
        ? `\nCheckpoint: phase=${formatPhaseLabel(message.checkpoint.targetPhase)}, approvalRequired=${message.checkpoint.requiresClientApproval}, approved=${message.checkpoint.clientApprovedAt ?? 'pending'}, superseded=${message.checkpoint.superseded}`
        : ''
      return `[${formatMessageTimestamp(message.timestamp)}] ${message.author} (${message.role}): ${message.body}${attachments}${checkpoint}`
    })
    .join('\n\n')
}
