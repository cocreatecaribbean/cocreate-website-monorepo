import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common'
import {
  THREAD_SUMMARY_CONTENT_VERSION,
  ThreadSummaryContentSchema,
  ThreadSummaryPayloadSchema,
  buildSummaryPayload,
  normalizeOrgInboxMessages,
  normalizeProjectMessages,
  renderThreadSummaryPdf,
  summarizeThreadMessages,
  threadSummaryPdfFilename,
  type ThreadSummaryContent,
  type ThreadSummaryPayload,
  type ThreadSummarySourceType,
} from '@cocreate/message-summary'
import { resolveOpenAiApiKey } from '@cocreate/ai-core/models'
import type { AuthenticatedAdmin, AuthenticatedAgencyUser, AuthenticatedClient } from '../auth/auth.service'
import { OrgInboxService } from '../org-inbox/org-inbox.service'
import { ProjectsService } from '../projects/projects.service'
import { serializeMessage } from '../projects/projects.serializer'
import {
  ThreadSummaryRateLimitService,
  ThreadSummaryStoreService,
} from './thread-summary-store.service'

type AgencyOrClient = AuthenticatedAgencyUser | AuthenticatedClient

const PROJECT_REQUEST_TYPE_LABEL: Record<string, string> = {
  ONBOARDING: 'Onboarding',
  PROGRESS: 'Progress',
  CANCELLATION: 'Cancellation request',
  INTERNAL: 'Team review',
}

function projectRequestSummaryLabels(request: {
  type: string
  title: string
  projectTitle: string | null
  organizationName: string | null
}): { title: string; subtitle: string | null } {
  const threadLabel = PROJECT_REQUEST_TYPE_LABEL[request.type] ?? request.type
  const title = request.projectTitle?.trim() || request.title
  const subtitleParts = [threadLabel]
  if (request.organizationName?.trim()) {
    subtitleParts.push(request.organizationName.trim())
  }
  return { title, subtitle: subtitleParts.join(' · ') }
}

@Injectable()
export class MessagingSummaryService {
  constructor(
    private readonly projects: ProjectsService,
    private readonly inbox: OrgInboxService,
    private readonly store: ThreadSummaryStoreService,
    private readonly rateLimit: ThreadSummaryRateLimitService,
  ) {}

  private assertAiConfigured(): void {
    if (!resolveOpenAiApiKey()) {
      throw new ServiceUnavailableException(
        'AI summary is not configured. Set OPENAI_API_KEY or AI_GATEWAY_API_KEY.',
      )
    }
  }

  async generateProjectRequestSummary(
    actor: AgencyOrClient,
    requestId: string,
    options?: { force?: boolean },
  ) {
    this.assertAiConfigured()
    this.rateLimit.assertWithinLimit(actor.id)

    const request = await this.projects.getRequestThread(actor, requestId)
    const messages = await this.fetchAllProjectMessages(actor, requestId)
    const normalized = normalizeProjectMessages(
      messages.map((message) => ({
        id: message.id,
        authorDisplayName: message.authorDisplayName,
        authorEmail: message.authorEmail,
        authorRole: message.authorRole,
        body: message.body,
        createdAt: message.createdAt,
        messageKind: message.messageKind,
        attachments: message.attachments?.map((attachment) => ({
          id: attachment.id,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
        })),
      })),
    )

    const lastMessageAt = this.resolveLastMessageAt(normalized)
    const cached = await this.store.findCached('PROJECT_REQUEST', requestId)
    const summaryLabels = projectRequestSummaryLabels(request)

    if (
      !options?.force &&
      cached &&
      cached.messageCount === normalized.length &&
      cached.lastMessageAt.getTime() === lastMessageAt.getTime()
    ) {
      const cachedSummary = this.tryParseStoredSummary(cached, {
        sourceType: 'PROJECT_REQUEST',
        sourceId: requestId,
        title: summaryLabels.title,
        subtitle: summaryLabels.subtitle,
        stale: false,
      })
      if (cachedSummary) {
        return { ok: true as const, summary: cachedSummary, cached: true }
      }
    }

    const result = await summarizeThreadMessages({
      title: summaryLabels.title,
      subtitle: summaryLabels.subtitle,
      messages: normalized,
    })

    const summary = buildSummaryPayload({
      sourceType: 'PROJECT_REQUEST',
      sourceId: requestId,
      title: summaryLabels.title,
      subtitle: summaryLabels.subtitle,
      content: result.content,
      messageCount: result.messageCount,
      model: result.model,
      truncated: result.truncated,
    })

    await this.store.upsert({
      sourceType: 'PROJECT_REQUEST',
      sourceId: requestId,
      messageCount: result.messageCount,
      lastMessageAt,
      content: result.content,
      model: result.model,
    })

    return { ok: true as const, summary, cached: false }
  }

  async generateOrgInboxSummary(
    viewer: AuthenticatedClient | AuthenticatedAdmin,
    conversationId: string,
    options?: { force?: boolean },
  ) {
    this.assertAiConfigured()
    this.rateLimit.assertWithinLimit(viewer.id)

    const { messages } = await this.inbox.listMessages(conversationId, viewer)
    const conversation = await this.inbox.getConversationForSummary(
      conversationId,
      viewer,
    )

    const normalized = normalizeOrgInboxMessages(
      messages.map((message) => ({
        id: message.id,
        authorEmail: message.authorEmail,
        authorRole: message.authorRole,
        body: message.body,
        createdAt: message.createdAt,
        attachments: message.attachments?.map((attachment) => ({
          id: attachment.id,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
        })),
      })),
    )

    const lastMessageAt = this.resolveLastMessageAt(normalized)
    const cached = await this.store.findCached('ORG_INBOX', conversationId)

    if (
      !options?.force &&
      cached &&
      cached.messageCount === normalized.length &&
      cached.lastMessageAt.getTime() === lastMessageAt.getTime()
    ) {
      const cachedSummary = this.tryParseStoredSummary(cached, {
        sourceType: 'ORG_INBOX',
        sourceId: conversationId,
        title: conversation.title,
        subtitle: conversation.subtitle,
        stale: false,
      })
      if (cachedSummary) {
        return { ok: true as const, summary: cachedSummary, cached: true }
      }
    }

    const result = await summarizeThreadMessages({
      title: conversation.title,
      subtitle: conversation.subtitle,
      messages: normalized,
    })

    const summary = buildSummaryPayload({
      sourceType: 'ORG_INBOX',
      sourceId: conversationId,
      title: conversation.title,
      subtitle: conversation.subtitle,
      content: result.content,
      messageCount: result.messageCount,
      model: result.model,
      truncated: result.truncated,
    })

    await this.store.upsert({
      sourceType: 'ORG_INBOX',
      sourceId: conversationId,
      messageCount: result.messageCount,
      lastMessageAt,
      content: result.content,
      model: result.model,
    })

    return { ok: true as const, summary, cached: false }
  }

  async exportProjectRequestSummaryPdf(
    actor: AgencyOrClient,
    requestId: string,
    options?: { force?: boolean },
  ) {
    const result = await this.generateProjectRequestSummary(actor, requestId, options)
    const imageDataByAttachmentId = await this.resolveSummaryPdfImages(
      result.summary,
      actor,
    )
    const buffer = await renderThreadSummaryPdf(result.summary, {
      imageDataByAttachmentId,
    })
    return {
      buffer,
      filename: threadSummaryPdfFilename(result.summary),
    }
  }

  async exportOrgInboxSummaryPdf(
    viewer: AuthenticatedClient | AuthenticatedAdmin,
    conversationId: string,
    options?: { force?: boolean },
  ) {
    const result = await this.generateOrgInboxSummary(viewer, conversationId, options)
    const imageDataByAttachmentId = await this.resolveSummaryPdfImages(
      result.summary,
      viewer,
    )
    const buffer = await renderThreadSummaryPdf(result.summary, {
      imageDataByAttachmentId,
    })
    return {
      buffer,
      filename: threadSummaryPdfFilename(result.summary),
    }
  }

  invalidateProjectRequestSummary(requestId: string): Promise<void> {
    return this.store.invalidate('PROJECT_REQUEST', requestId)
  }

  invalidateOrgInboxSummary(conversationId: string): Promise<void> {
    return this.store.invalidate('ORG_INBOX', conversationId)
  }

  private async resolveSummaryPdfImages(
    summary: ThreadSummaryPayload,
    actor: AgencyOrClient | AuthenticatedClient | AuthenticatedAdmin,
  ): Promise<Record<string, string>> {
    const imageDataByAttachmentId: Record<string, string> = {}

    for (const file of summary.referencedFiles.filter((entry) => entry.isImage)) {
      try {
        const bytes =
          summary.sourceType === 'PROJECT_REQUEST'
            ? await this.projects.downloadAttachmentBytes(
                actor as AgencyOrClient,
                file.attachmentId,
              )
            : await this.inbox.downloadAttachmentBytes(
                actor as AuthenticatedClient | AuthenticatedAdmin,
                file.attachmentId,
              )

        if (!bytes) continue

        imageDataByAttachmentId[file.attachmentId] =
          `data:${file.mimeType};base64,${bytes.toString('base64')}`
      } catch {
        // Skip images that cannot be resolved; PDF falls back to filename + text.
      }
    }

    return imageDataByAttachmentId
  }

  private async fetchAllProjectMessages(actor: AgencyOrClient, requestId: string) {
    let cursor: string | undefined
    let collected: ReturnType<typeof serializeMessage>[] = []

    while (true) {
      const page = await this.projects.listRequestMessages(actor, requestId, {
        cursor,
        limit: 100,
      })
      collected = [...page.messages, ...collected]
      if (!page.nextCursor) break
      cursor = page.nextCursor
    }

    if (collected.length > 0) return collected

    const thread = await this.projects.getRequestThread(actor, requestId)
    return thread.messages ?? []
  }

  private resolveLastMessageAt(
    messages: Array<{ timestamp: string }>,
  ): Date {
    if (messages.length === 0) return new Date(0)
    return new Date(messages[messages.length - 1]!.timestamp)
  }

  private tryParseStoredSummary(
    cached: {
      content: unknown
      messageCount: number
      model: string
      lastMessageAt: Date
    },
    meta: {
      sourceType: ThreadSummarySourceType
      sourceId: string
      title: string
      subtitle: string | null
      stale: boolean
    },
  ): ThreadSummaryPayload | null {
    try {
      return this.parseStoredSummary(cached, meta)
    } catch {
      return null
    }
  }

  private parseStoredSummary(
    cached: {
      content: unknown
      messageCount: number
      model: string
      lastMessageAt: Date
    },
    meta: {
      sourceType: ThreadSummarySourceType
      sourceId: string
      title: string
      subtitle: string | null
      stale: boolean
    },
  ): ThreadSummaryPayload {
    const content = this.parseStoredContent(cached.content)
    const payload = buildSummaryPayload({
      sourceType: meta.sourceType,
      sourceId: meta.sourceId,
      title: meta.title,
      subtitle: meta.subtitle,
      content,
      messageCount: cached.messageCount,
      model: cached.model,
      stale: meta.stale,
    })
    return ThreadSummaryPayloadSchema.parse(payload)
  }

  private parseStoredContent(raw: unknown): ThreadSummaryContent {
    const legacy = (raw ?? {}) as Record<string, unknown>

    if (legacy.contentVersion !== THREAD_SUMMARY_CONTENT_VERSION) {
      throw new Error('Stale summary content version')
    }

    const referencedFiles = (
      Array.isArray(legacy.referencedFiles) ? legacy.referencedFiles : []
    )
      .map((file) => {
        if (
          typeof file !== 'object' ||
          file === null ||
          !('mimeType' in file) ||
          !('isImage' in file)
        ) {
          return null
        }
        const entry = file as Record<string, unknown>
        return {
          attachmentId: typeof entry.attachmentId === 'string' ? entry.attachmentId : '',
          fileName: typeof entry.fileName === 'string' ? entry.fileName : '',
          caption: typeof entry.caption === 'string' ? entry.caption : null,
          mimeType: typeof entry.mimeType === 'string' ? entry.mimeType : '',
          isImage: Boolean(entry.isImage),
          sharedBy: typeof entry.sharedBy === 'string' ? entry.sharedBy : null,
          sharedAt: typeof entry.sharedAt === 'string' ? entry.sharedAt : null,
          sharedRole: typeof entry.sharedRole === 'string' ? entry.sharedRole : null,
          messageBody: typeof entry.messageBody === 'string' ? entry.messageBody : null,
        }
      })
      .filter((file): file is NonNullable<typeof file> => file !== null && file.attachmentId.length > 0)

    return {
      contentVersion: THREAD_SUMMARY_CONTENT_VERSION,
      ...ThreadSummaryContentSchema.parse({
        overview: typeof legacy.overview === 'string' ? legacy.overview : '',
        deliverablesPresented: Array.isArray(legacy.deliverablesPresented)
          ? legacy.deliverablesPresented
          : [],
        clientFeedback: Array.isArray(legacy.clientFeedback)
          ? legacy.clientFeedback
          : [],
        decisions: Array.isArray(legacy.decisions) ? legacy.decisions : [],
        actionItems: Array.isArray(legacy.actionItems) ? legacy.actionItems : [],
        timeline: Array.isArray(legacy.timeline) ? legacy.timeline : [],
        openQuestions: Array.isArray(legacy.openQuestions) ? legacy.openQuestions : [],
        referencedFiles,
      }),
    }
  }
}
