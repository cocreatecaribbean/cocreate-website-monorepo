import { generateStructured, getSummaryChatModel, resolveSummaryChatModelName } from '@cocreate/ai-core'
import { z } from 'zod'
import {
  capMessages,
  chunkMessages,
  shouldUseMapReduce,
} from './chunking'
import {
  collectAttachmentCatalog,
  enrichSummaryContent,
} from './enrich-summary'
import {
  formatGlobalAttachmentCatalog,
  formatMessagesForPrompt,
  type NormalizedThreadMessage,
} from './normalizer'
import {
  buildChunkMergePrompt,
  buildChunkPartialPrompt,
  buildThreadSummaryPrompt,
  THREAD_SUMMARY_SYSTEM_PROMPT,
} from './prompts'
import {
  ThreadSummaryAiContentSchema,
  type ThreadSummaryContent,
  type ThreadSummaryPayload,
} from './schema'

const PartialChunkSummarySchema = z.object({
  notes: z.string(),
})

const MergeSummarySchema = ThreadSummaryAiContentSchema

export type SummarizeThreadOptions = {
  title: string
  subtitle?: string | null
  messages: NormalizedThreadMessage[]
}

export async function summarizeThreadMessages(
  options: SummarizeThreadOptions,
): Promise<{
  content: ThreadSummaryContent
  messageCount: number
  truncated: boolean
  model: string
}> {
  const { messages: capped, truncated } = capMessages(options.messages)
  const messageCount = capped.length
  const catalog = collectAttachmentCatalog(capped)
  const attachmentCatalog = formatGlobalAttachmentCatalog(capped)
  const summaryModel = getSummaryChatModel()

  if (messageCount === 0) {
    return {
      content: enrichSummaryContent(
        {
          overview: 'No messages in this thread yet.',
          deliverablesPresented: [],
          clientFeedback: [],
          decisions: [],
          actionItems: [],
          timeline: [],
          openQuestions: [],
          referencedFiles: [],
        },
        catalog,
        capped,
      ),
      messageCount: 0,
      truncated: false,
      model: resolveSummaryChatModelName(),
    }
  }

  let content: ThreadSummaryContent

  if (shouldUseMapReduce(messageCount)) {
    const chunks = chunkMessages(capped)
    const partials: string[] = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]!
      const partial = await generateStructured({
        schema: PartialChunkSummarySchema,
        system: THREAD_SUMMARY_SYSTEM_PROMPT,
        model: summaryModel,
        prompt: buildChunkPartialPrompt({
          title: options.title,
          chunkIndex: i,
          chunkCount: chunks.length,
          attachmentCatalog: formatGlobalAttachmentCatalog(chunk),
          threadBody: formatMessagesForPrompt(chunk),
        }),
      })
      partials.push(partial.notes)
    }

    const aiContent = await generateStructured({
      schema: MergeSummarySchema,
      system: THREAD_SUMMARY_SYSTEM_PROMPT,
      model: summaryModel,
      prompt: buildChunkMergePrompt({
        title: options.title,
        chunkSummaries: partials,
        truncated,
      }),
    })
    content = enrichSummaryContent(aiContent, catalog, capped)
  } else {
    const aiContent = await generateStructured({
      schema: MergeSummarySchema,
      system: THREAD_SUMMARY_SYSTEM_PROMPT,
      model: summaryModel,
      prompt: buildThreadSummaryPrompt({
        title: options.title,
        subtitle: options.subtitle,
        attachmentCatalog,
        threadBody: formatMessagesForPrompt(capped),
        truncated,
      }),
    })
    content = enrichSummaryContent(aiContent, catalog, capped)
  }

  return {
    content,
    messageCount,
    truncated,
    model: resolveSummaryChatModelName(),
  }
}

export function buildSummaryPayload(options: {
  sourceType: 'PROJECT_REQUEST' | 'ORG_INBOX'
  sourceId: string
  title: string
  subtitle?: string | null
  content: ThreadSummaryContent
  messageCount: number
  model: string
  truncated?: boolean
  stale?: boolean
}): ThreadSummaryPayload {
  return {
    ...options.content,
    sourceType: options.sourceType,
    sourceId: options.sourceId,
    title: options.title,
    subtitle: options.subtitle ?? null,
    messageCount: options.messageCount,
    generatedAt: new Date().toISOString(),
    model: options.model,
    ...(options.truncated ? { truncated: true } : {}),
    ...(options.stale ? { stale: true } : {}),
  }
}
