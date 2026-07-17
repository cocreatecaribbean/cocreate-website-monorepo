export const THREAD_SUMMARY_SYSTEM_PROMPT = `You are a senior project account manager at CoCreate Caribbean writing a client-ready thread briefing.
Your reader must understand exactly what was delivered, what the client asked to change, and where things stand — without reading the full thread.

Rules:
- Be specific: name people, deliverables, file names, design details, copy, colors, layout, scope items, and dates from the messages
- Never write vague lines like "discussed updates" or "shared feedback" without stating what was actually shared or requested
- Separate agency submissions from client change requests — do not merge them in the overview
- Format all dates like "Sunday, July 5" (weekday, full month name, day — no ISO timestamps)
- deliverablesPresented and clientFeedback are required sections — return [] only if truly none exist in the thread
- referencedFiles: include every image attachment from the catalog plus any non-image files central to deliverables or feedback; use exact attachment ids from the catalog
- If a section has no relevant content besides deliverablesPresented/clientFeedback, return an empty array for that section
- Be factual; do not invent decisions, dates, action owners, or file references`

export function buildThreadSummaryPrompt(options: {
  title: string
  subtitle?: string | null
  attachmentCatalog: string
  threadBody: string
  truncated?: boolean
}): string {
  const subtitle = options.subtitle?.trim()
    ? `\nContext: ${options.subtitle}`
    : ''
  const truncated = options.truncated
    ? '\nNote: The thread was truncated to the most recent 500 messages.'
    : ''
  const catalog = options.attachmentCatalog.trim()
    ? `${options.attachmentCatalog}\n`
    : ''

  return `Thread title: ${options.title}${subtitle}${truncated}

${catalog}Messages (oldest to newest):
${options.threadBody}

Produce a structured summary:
- overview: 2–3 dense paragraphs covering current status, the latest deliverable shared, the latest client ask, and anything blocking progress
- deliverablesPresented: each item CoCreate/agency shared with the client (mockups, drafts, files, checkpoints) — title, concrete detail of what was shown, who presented it, date when known
- clientFeedback: each specific change request, revision, or approval from the client — the exact ask, what it relates to, who requested it, date, status (pending/addressed/approved/unknown)
- timeline: chronological story of key moments — each entry names who did what and cites file names when relevant; use friendly dates
- decisions: agreed outcomes, approvals, scope or timeline changes (include date when known)
- actionItems: clear next steps; include owner when inferable from messages
- openQuestions: unresolved items needing follow-up
- referencedFiles: every image from the catalog plus key non-image deliverables — exact attachment ids with a caption explaining why each file matters`
}

export function buildChunkMergePrompt(options: {
  title: string
  chunkSummaries: string[]
  truncated?: boolean
}): string {
  const truncated = options.truncated
    ? '\nNote: Source thread was truncated to 500 messages.'
    : ''

  return `Thread title: ${options.title}${truncated}

Partial summaries from sequential chunks of a long conversation:
${options.chunkSummaries.map((summary, index) => `--- Chunk ${index + 1} ---\n${summary}`).join('\n\n')}

Merge these into one cohesive structured summary. Deduplicate repeated points.
Keep chronological order in timeline. Use friendly dates like "Sunday, July 5".
Preserve specific names, deliverable details, client change requests, and attachment ids when present.
Ensure deliverablesPresented and clientFeedback capture all agency submissions and client asks from the chunks.`
}

export function buildChunkPartialPrompt(options: {
  title: string
  chunkIndex: number
  chunkCount: number
  attachmentCatalog: string
  threadBody: string
}): string {
  const catalog = options.attachmentCatalog.trim()
    ? `${options.attachmentCatalog}\n`
    : ''

  return `Thread title: ${options.title}
Chunk ${options.chunkIndex + 1} of ${options.chunkCount}.

${catalog}Extract key facts from this segment only:
- What CoCreate/agency presented or delivered (specific deliverables, files, checkpoints)
- What the client requested, changed, approved, or rejected (exact asks)
- Decisions, action items, milestones, open questions
- Important files (use exact attachment ids from the catalog)

Messages:
${options.threadBody}`
}
