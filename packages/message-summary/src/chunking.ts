import type { NormalizedThreadMessage } from './normalizer'

export const SINGLE_CALL_MESSAGE_LIMIT = 80
export const CHUNK_SIZE = 40
export const MAX_MESSAGES = 500

export function chunkMessages(
  messages: NormalizedThreadMessage[],
  chunkSize = CHUNK_SIZE,
): NormalizedThreadMessage[][] {
  if (messages.length === 0) return []
  const chunks: NormalizedThreadMessage[][] = []
  for (let i = 0; i < messages.length; i += chunkSize) {
    chunks.push(messages.slice(i, i + chunkSize))
  }
  return chunks
}

export function shouldUseMapReduce(messageCount: number): boolean {
  return messageCount > SINGLE_CALL_MESSAGE_LIMIT
}

export function capMessages<T>(messages: T[]): {
  messages: T[]
  truncated: boolean
} {
  if (messages.length <= MAX_MESSAGES) {
    return { messages, truncated: false }
  }
  return { messages: messages.slice(0, MAX_MESSAGES), truncated: true }
}
