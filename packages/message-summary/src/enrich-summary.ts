import { formatMessageTimestamp, formatSummaryDate } from './format-date'
import type { NormalizedThreadMessage } from './normalizer'
import type {
  ThreadSummaryAiContent,
  ThreadSummaryContent,
  ThreadSummaryCoreContent,
  ThreadSummaryReferencedFile,
  ThreadSummaryReferencedFilePayload,
} from './schema'
import {
  THREAD_SUMMARY_CONTENT_VERSION,
} from './schema'

export type AttachmentCatalogEntry = {
  id: string
  fileName: string
  mimeType: string
  isImage: boolean
}

const MAX_GALLERY_IMAGES = 12

export function collectAttachmentCatalog(
  messages: NormalizedThreadMessage[],
): Map<string, AttachmentCatalogEntry> {
  const catalog = new Map<string, AttachmentCatalogEntry>()

  for (const message of messages) {
    for (const attachment of message.attachments) {
      catalog.set(attachment.id, attachment)
    }
  }

  return catalog
}

function buildAttachmentContextMap(
  messages: NormalizedThreadMessage[],
): Map<string, NormalizedThreadMessage> {
  const context = new Map<string, NormalizedThreadMessage>()

  for (const message of messages) {
    for (const attachment of message.attachments) {
      context.set(attachment.id, message)
    }
  }

  return context
}

function messageTimestampForAttachment(
  attachmentId: string,
  context: Map<string, NormalizedThreadMessage>,
): string {
  return context.get(attachmentId)?.timestamp ?? ''
}

function attachMessageContext(
  file: Omit<
    ThreadSummaryReferencedFilePayload,
    'sharedBy' | 'sharedAt' | 'sharedRole' | 'messageBody'
  >,
  context: Map<string, NormalizedThreadMessage>,
): ThreadSummaryReferencedFilePayload {
  const message = context.get(file.attachmentId)
  const body = message?.body.trim() ?? ''

  return {
    ...file,
    sharedBy: message?.author ?? null,
    sharedAt: message ? formatMessageTimestamp(message.timestamp) : null,
    sharedRole: message?.role ?? null,
    messageBody: body.length > 0 ? body : null,
  }
}

function buildFallbackCaption(
  attachmentId: string,
  catalog: Map<string, AttachmentCatalogEntry>,
  context: Map<string, NormalizedThreadMessage>,
): string {
  const entry = catalog.get(attachmentId)
  const message = context.get(attachmentId)
  if (!message || !entry) return entry?.fileName ?? 'Shared file'

  const snippet = message.body.trim().replace(/\s+/g, ' ').slice(0, 120)
  const date = formatMessageTimestamp(message.timestamp)
  const detail = snippet ? `: ${snippet}${message.body.length > 120 ? '…' : ''}` : ''
  return `Shared by ${message.author} on ${date}${detail}`
}

function scoreImageAttachment(
  attachmentId: string,
  catalog: Map<string, AttachmentCatalogEntry>,
  context: Map<string, NormalizedThreadMessage>,
  messageIndex: Map<string, number>,
  messages: NormalizedThreadMessage[],
): number {
  const entry = catalog.get(attachmentId)
  const message = context.get(attachmentId)
  if (!entry?.isImage || !message) return -1

  let score = messageIndex.get(message.id) ?? 0

  if (message.checkpoint) score += 1000

  const bodyLower = message.body.toLowerCase()
  const fileNameLower = entry.fileName.toLowerCase()
  if (bodyLower.includes(fileNameLower) || fileNameLower.includes(bodyLower.slice(0, 20))) {
    score += 100
  }

  for (let i = messages.length - 1; i >= 0; i--) {
    const later = messages[i]!
    if (later.body.toLowerCase().includes(fileNameLower)) {
      score += 50
      break
    }
  }

  return score
}

function sortReferencedFiles(
  files: ThreadSummaryReferencedFilePayload[],
  context: Map<string, NormalizedThreadMessage>,
): ThreadSummaryReferencedFilePayload[] {
  return [...files].sort((a, b) => {
    const imageDelta = Number(b.isImage) - Number(a.isImage)
    if (imageDelta !== 0) return imageDelta

    const aTime = messageTimestampForAttachment(a.attachmentId, context)
    const bTime = messageTimestampForAttachment(b.attachmentId, context)
    if (aTime !== bTime) return aTime.localeCompare(bTime)

    return a.fileName.localeCompare(b.fileName)
  })
}

export function enrichReferencedFiles(
  raw: ThreadSummaryReferencedFile[],
  catalog: Map<string, AttachmentCatalogEntry>,
  context: Map<string, NormalizedThreadMessage>,
): ThreadSummaryReferencedFilePayload[] {
  const seen = new Set<string>()

  return raw
    .filter((ref) => catalog.has(ref.attachmentId))
    .flatMap((ref) => {
      if (seen.has(ref.attachmentId)) return []
      seen.add(ref.attachmentId)

      const entry = catalog.get(ref.attachmentId)!
      return [
        attachMessageContext(
          {
            attachmentId: ref.attachmentId,
            fileName: entry.fileName,
            caption: ref.caption,
            mimeType: entry.mimeType,
            isImage: entry.isImage,
          },
          context,
        ),
      ]
    })
}

export function mergeAttachmentGallery(
  enriched: ThreadSummaryReferencedFilePayload[],
  catalog: Map<string, AttachmentCatalogEntry>,
  messages: NormalizedThreadMessage[],
  maxImages = MAX_GALLERY_IMAGES,
): ThreadSummaryReferencedFilePayload[] {
  const seen = new Set(enriched.map((file) => file.attachmentId))
  const context = buildAttachmentContextMap(messages)
  const messageIndex = new Map(messages.map((message, index) => [message.id, index]))

  const imageCount = enriched.filter((file) => file.isImage).length
  const remainingSlots = Math.max(0, maxImages - imageCount)

  const merged = [...enriched]

  if (remainingSlots > 0) {
    const candidates = [...catalog.entries()]
      .filter(([id, entry]) => entry.isImage && !seen.has(id))
      .map(([id]) => ({
        id,
        score: scoreImageAttachment(id, catalog, context, messageIndex, messages),
      }))
      .filter((item) => item.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, remainingSlots)

    for (const candidate of candidates) {
      const entry = catalog.get(candidate.id)!
      merged.push(
        attachMessageContext(
          {
            attachmentId: candidate.id,
            fileName: entry.fileName,
            caption: buildFallbackCaption(candidate.id, catalog, context),
            mimeType: entry.mimeType,
            isImage: entry.isImage,
          },
          context,
        ),
      )
      seen.add(candidate.id)
    }
  }

  return sortReferencedFiles(
    merged.map((file) =>
      file.sharedBy
        ? file
        : attachMessageContext(file, context),
    ),
    context,
  )
}

export function formatSummaryContentDates(
  content: ThreadSummaryCoreContent,
): ThreadSummaryCoreContent {
  return {
    ...content,
    deliverablesPresented: content.deliverablesPresented.map((item) => ({
      ...item,
      date: item.date ? formatSummaryDate(item.date) : null,
    })),
    clientFeedback: content.clientFeedback.map((item) => ({
      ...item,
      date: item.date ? formatSummaryDate(item.date) : null,
    })),
    decisions: content.decisions.map((item) => ({
      ...item,
      date: item.date ? formatSummaryDate(item.date) : null,
    })),
    actionItems: content.actionItems.map((item) => ({
      ...item,
      dueHint: item.dueHint ? formatSummaryDate(item.dueHint) : null,
    })),
    timeline: content.timeline.map((item) => ({
      ...item,
      date: formatSummaryDate(item.date),
    })),
  }
}

export function enrichSummaryContent(
  aiContent: ThreadSummaryAiContent,
  catalog: Map<string, AttachmentCatalogEntry>,
  messages: NormalizedThreadMessage[],
): ThreadSummaryContent {
  const context = buildAttachmentContextMap(messages)
  const aiReferenced = enrichReferencedFiles(aiContent.referencedFiles, catalog, context)
  const referencedFiles = mergeAttachmentGallery(aiReferenced, catalog, messages)
  const formatted = formatSummaryContentDates({
    ...aiContent,
    referencedFiles,
  })

  return {
    ...formatted,
    contentVersion: THREAD_SUMMARY_CONTENT_VERSION,
  }
}

function normalizeReferencedFile(raw: unknown): ThreadSummaryReferencedFilePayload | null {
  if (!raw || typeof raw !== 'object') return null
  const file = raw as Record<string, unknown>
  if (
    typeof file.attachmentId !== 'string' ||
    typeof file.fileName !== 'string' ||
    typeof file.mimeType !== 'string' ||
    typeof file.isImage !== 'boolean'
  ) {
    return null
  }

  return {
    attachmentId: file.attachmentId,
    fileName: file.fileName,
    caption: typeof file.caption === 'string' ? file.caption : null,
    mimeType: file.mimeType,
    isImage: file.isImage,
    sharedBy: typeof file.sharedBy === 'string' ? file.sharedBy : null,
    sharedAt: typeof file.sharedAt === 'string' ? file.sharedAt : null,
    sharedRole: typeof file.sharedRole === 'string' ? file.sharedRole : null,
    messageBody: typeof file.messageBody === 'string' ? file.messageBody : null,
  }
}

export function normalizeLegacySummaryContent(
  content: unknown,
): ThreadSummaryContent {
  const raw = (content ?? {}) as Record<string, unknown>
  const referencedFiles = Array.isArray(raw.referencedFiles)
    ? raw.referencedFiles
        .map(normalizeReferencedFile)
        .filter((file): file is ThreadSummaryReferencedFilePayload => file !== null)
    : []

  return {
    contentVersion: THREAD_SUMMARY_CONTENT_VERSION,
    overview: typeof raw.overview === 'string' ? raw.overview : '',
    deliverablesPresented: Array.isArray(raw.deliverablesPresented)
      ? raw.deliverablesPresented
      : [],
    clientFeedback: Array.isArray(raw.clientFeedback) ? raw.clientFeedback : [],
    decisions: Array.isArray(raw.decisions) ? raw.decisions : [],
    actionItems: Array.isArray(raw.actionItems) ? raw.actionItems : [],
    timeline: Array.isArray(raw.timeline) ? raw.timeline : [],
    openQuestions: Array.isArray(raw.openQuestions) ? raw.openQuestions : [],
    referencedFiles,
  }
}

export function withContentVersion(
  content: ThreadSummaryContent,
): ThreadSummaryContent {
  return {
    ...content,
    contentVersion: THREAD_SUMMARY_CONTENT_VERSION,
  }
}
