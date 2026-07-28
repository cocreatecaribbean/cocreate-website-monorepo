export const THREAD_TRANSCRIPT_MESSAGE_CAP = 2000
export const THREAD_TRANSCRIPT_IMAGE_CAP = 40

export type ThreadTranscriptAttachment = {
  id: string
  fileName: string
  mimeType: string
  isImage: boolean
}

export type ThreadTranscriptMessage = {
  id: string
  author: string
  role: string
  kind: string | null
  timestamp: string
  body: string
  attachments: ThreadTranscriptAttachment[]
}

export type ThreadTranscriptPayload = {
  title: string
  subtitle: string | null
  sourceId: string
  rangeLabel: string
  exportedAt: string
  /** IANA timezone used to format timestamps in the PDF */
  timeZone: string
  messageCount: number
  truncated: boolean
  /** True when more image attachments existed than THREAD_TRANSCRIPT_IMAGE_CAP */
  imagesTruncated: boolean
  messages: ThreadTranscriptMessage[]
}

export type TranscriptDateRange = {
  from?: string
  to?: string
  timeZone?: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function parseTranscriptDateRange(
  range?: TranscriptDateRange,
  timeZone = 'America/Jamaica',
): {
  fromInclusive: Date | null
  toInclusive: Date | null
  rangeLabel: string
} {
  const fromRaw = range?.from?.trim() || undefined
  const toRaw = range?.to?.trim() || undefined

  if (fromRaw && !ISO_DATE.test(fromRaw)) {
    throw new Error('Invalid from date. Use YYYY-MM-DD.')
  }
  if (toRaw && !ISO_DATE.test(toRaw)) {
    throw new Error('Invalid to date. Use YYYY-MM-DD.')
  }

  const fromInclusive = fromRaw
    ? zonedDayBound(fromRaw, timeZone, false)
    : null
  const toInclusive = toRaw ? zonedDayBound(toRaw, timeZone, true) : null

  if (fromInclusive && toInclusive && fromInclusive.getTime() > toInclusive.getTime()) {
    throw new Error('Invalid date range: from must be on or before to.')
  }

  let rangeLabel = 'All messages'
  if (fromRaw && toRaw) {
    rangeLabel = `${fromRaw} to ${toRaw} (${timeZone})`
  } else if (fromRaw) {
    rangeLabel = `From ${fromRaw} (${timeZone})`
  } else if (toRaw) {
    rangeLabel = `Through ${toRaw} (${timeZone})`
  }

  return { fromInclusive, toInclusive, rangeLabel }
}

type TzParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function getTzParts(date: Date, timeZone: string): TzParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0')

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  }
}

/** Start or end of a calendar day in `timeZone`, as a UTC Date. */
function zonedDayBound(
  yyyyMmDd: string,
  timeZone: string,
  endOfDay: boolean,
): Date {
  const [year, month, day] = yyyyMmDd.split('-').map(Number) as [
    number,
    number,
    number,
  ]
  const hour = endOfDay ? 23 : 0
  const minute = endOfDay ? 59 : 0
  const second = endOfDay ? 59 : 0
  const ms = endOfDay ? 999 : 0

  let utcMs = Date.UTC(year, month - 1, day, hour, minute, second, ms)
  for (let i = 0; i < 4; i++) {
    const parts = getTzParts(new Date(utcMs), timeZone)
    const asIfUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      ms,
    )
    const desired = Date.UTC(year, month - 1, day, hour, minute, second, ms)
    const delta = desired - asIfUtc
    if (delta === 0) break
    utcMs += delta
  }
  return new Date(utcMs)
}

export function filterMessagesByDateRange<T extends { timestamp: string }>(
  messages: T[],
  fromInclusive: Date | null,
  toInclusive: Date | null,
): T[] {
  if (!fromInclusive && !toInclusive) return messages
  return messages.filter((message) => {
    const time = Date.parse(message.timestamp)
    if (Number.isNaN(time)) return false
    if (fromInclusive && time < fromInclusive.getTime()) return false
    if (toInclusive && time > toInclusive.getTime()) return false
    return true
  })
}

export function capTranscriptMessages<T>(
  messages: T[],
  cap = THREAD_TRANSCRIPT_MESSAGE_CAP,
): { messages: T[]; truncated: boolean } {
  if (messages.length <= cap) {
    return { messages, truncated: false }
  }
  return {
    messages: messages.slice(messages.length - cap),
    truncated: true,
  }
}

export function buildThreadTranscriptPayload(input: {
  title: string
  subtitle: string | null
  sourceId: string
  rangeLabel: string
  timeZone: string
  messages: ThreadTranscriptMessage[]
  truncated: boolean
  imagesTruncated?: boolean
}): ThreadTranscriptPayload {
  return {
    title: input.title,
    subtitle: input.subtitle,
    sourceId: input.sourceId,
    rangeLabel: input.rangeLabel,
    exportedAt: new Date().toISOString(),
    timeZone: input.timeZone,
    messageCount: input.messages.length,
    truncated: input.truncated,
    imagesTruncated: input.imagesTruncated ?? false,
    messages: input.messages,
  }
}

/** First N unique image attachment IDs in chronological message order. */
export function collectTranscriptImageIds(
  messages: ThreadTranscriptMessage[],
  cap = THREAD_TRANSCRIPT_IMAGE_CAP,
): { attachmentIds: string[]; imagesTruncated: boolean } {
  const ids: string[] = []
  const seen = new Set<string>()
  for (const message of messages) {
    for (const attachment of message.attachments) {
      if (!attachment.isImage || seen.has(attachment.id)) continue
      seen.add(attachment.id)
      if (ids.length < cap) {
        ids.push(attachment.id)
      }
    }
  }
  return {
    attachmentIds: ids,
    imagesTruncated: seen.size > ids.length,
  }
}

export function threadTranscriptPdfFilename(payload: ThreadTranscriptPayload): string {
  const slug = payload.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  const date = payload.exportedAt.slice(0, 10)
  return `thread-transcript-${slug || payload.sourceId}-${date}.pdf`
}
