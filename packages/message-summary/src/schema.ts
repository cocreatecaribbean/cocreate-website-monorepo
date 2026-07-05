import { z } from 'zod'

export const ThreadSummarySourceTypeSchema = z.enum([
  'PROJECT_REQUEST',
  'ORG_INBOX',
])
export type ThreadSummarySourceType = z.infer<
  typeof ThreadSummarySourceTypeSchema
>

// Nullable fields must be required (not .optional()) for OpenAI strict structured output.
export const ThreadSummaryDecisionSchema = z.object({
  label: z.string(),
  detail: z.string(),
  date: z.string().nullable(),
})

export const ThreadSummaryActionItemSchema = z.object({
  owner: z.string().nullable(),
  task: z.string(),
  dueHint: z.string().nullable(),
})

export const ThreadSummaryTimelineEntrySchema = z.object({
  date: z.string(),
  event: z.string(),
})

export const ThreadSummaryReferencedFileSchema = z.object({
  attachmentId: z.string(),
  fileName: z.string(),
  caption: z.string().nullable(),
})

export const ThreadSummaryReferencedFilePayloadSchema =
  ThreadSummaryReferencedFileSchema.extend({
    mimeType: z.string(),
    isImage: z.boolean(),
    sharedBy: z.string().nullable(),
    sharedAt: z.string().nullable(),
    sharedRole: z.string().nullable(),
    messageBody: z.string().nullable(),
  })

export type ThreadSummaryReferencedFile = z.infer<
  typeof ThreadSummaryReferencedFileSchema
>
export type ThreadSummaryReferencedFilePayload = z.infer<
  typeof ThreadSummaryReferencedFilePayloadSchema
>

export const ThreadSummaryDeliverableSchema = z.object({
  title: z.string(),
  detail: z.string(),
  presentedBy: z.string().nullable(),
  date: z.string().nullable(),
})

export const ThreadSummaryClientFeedbackSchema = z.object({
  request: z.string(),
  relatedTo: z.string().nullable(),
  requestedBy: z.string().nullable(),
  date: z.string().nullable(),
  status: z
    .enum(['pending', 'addressed', 'approved', 'unknown'])
    .nullable(),
})

export type ThreadSummaryDeliverable = z.infer<
  typeof ThreadSummaryDeliverableSchema
>
export type ThreadSummaryClientFeedback = z.infer<
  typeof ThreadSummaryClientFeedbackSchema
>

export const THREAD_SUMMARY_CONTENT_VERSION = 3

export const ThreadSummaryCoreContentSchema = z.object({
  overview: z.string(),
  deliverablesPresented: z.array(ThreadSummaryDeliverableSchema),
  clientFeedback: z.array(ThreadSummaryClientFeedbackSchema),
  decisions: z.array(ThreadSummaryDecisionSchema),
  actionItems: z.array(ThreadSummaryActionItemSchema),
  timeline: z.array(ThreadSummaryTimelineEntrySchema),
  openQuestions: z.array(z.string()),
  referencedFiles: z.array(ThreadSummaryReferencedFilePayloadSchema),
})

export type ThreadSummaryCoreContent = z.infer<
  typeof ThreadSummaryCoreContentSchema
>

export const ThreadSummaryContentSchema = ThreadSummaryCoreContentSchema

export type ThreadSummaryContent = z.infer<
  typeof ThreadSummaryCoreContentSchema
> & {
  contentVersion?: number
}

export const ThreadSummaryMetadataSchema = z.object({
  sourceType: ThreadSummarySourceTypeSchema,
  sourceId: z.string(),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  messageCount: z.number(),
  generatedAt: z.string(),
  model: z.string(),
  truncated: z.boolean().optional(),
  stale: z.boolean().optional(),
})
export type ThreadSummaryMetadata = z.infer<typeof ThreadSummaryMetadataSchema>

export const ThreadSummaryPayloadSchema = ThreadSummaryCoreContentSchema.extend({
  contentVersion: z.number().optional(),
}).merge(ThreadSummaryMetadataSchema)
export type ThreadSummaryPayload = z.infer<typeof ThreadSummaryPayloadSchema>

export const GenerateThreadSummaryResponseSchema = z.object({
  ok: z.literal(true),
  summary: ThreadSummaryPayloadSchema,
  cached: z.boolean(),
})
export type GenerateThreadSummaryResponse = z.infer<
  typeof GenerateThreadSummaryResponseSchema
>

/** AI output before server enrichment (referencedFiles lack mimeType/isImage). */
export const ThreadSummaryAiContentSchema = ThreadSummaryCoreContentSchema.omit({
  referencedFiles: true,
}).extend({
  referencedFiles: z.array(ThreadSummaryReferencedFileSchema),
})
export type ThreadSummaryAiContent = z.infer<typeof ThreadSummaryAiContentSchema>
