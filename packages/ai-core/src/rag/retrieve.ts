import { embed, embedMany } from 'ai'
import type { QueryResult } from '@mastra/core/vector'
import { createOpenAiProvider, resolveOpenAiApiKey } from '../models'
import { isJunkChunkText } from './chunk-quality'
import {
  createMarketingPgVector,
  createPortalPgVector,
  MARKETING_ABOUT_INDEX,
  MARKETING_ABOUT_SOURCE_ID,
  MARKETING_EMBEDDING_DIMENSIONS,
  PORTAL_HELP_INDEX,
  portalHelpSourceForAudience,
  type PortalHelpAudience,
  resolveEmbeddingModelName,
} from './constants'

/** Default top-K for marketing chat — high enough to cover split team sections. */
export const MARKETING_RETRIEVE_TOP_K = 8

/** Default top-K for portal help chat. */
export const PORTAL_RETRIEVE_TOP_K = 8

export type RetrievedChunk = {
  text: string
  score: number
  source: string
}

function getEmbeddingModel() {
  if (!resolveOpenAiApiKey()) {
    throw new Error(
      'AI is not configured. Set OPENAI_API_KEY or AI_GATEWAY_API_KEY.',
    )
  }
  const openai = createOpenAiProvider()
  return openai.embedding(resolveEmbeddingModelName())
}

export async function embedTexts(values: string[]): Promise<number[][]> {
  if (values.length === 0) return []
  const { embeddings } = await embedMany({
    model: getEmbeddingModel(),
    values,
  })
  return embeddings
}

export async function embedQuery(value: string): Promise<number[]> {
  const { embedding } = await embed({
    model: getEmbeddingModel(),
    value,
  })
  return embedding
}

function mapQueryResults(
  results: QueryResult[],
  fallbackSource: string,
  topK: number,
  sourceFilter?: string,
): RetrievedChunk[] {
  return results
    .map((row: QueryResult) => {
      const metadata = (row.metadata ?? {}) as Record<string, unknown>
      const text =
        typeof metadata.text === 'string'
          ? metadata.text
          : typeof row.document === 'string'
            ? row.document
            : ''
      if (!text.trim() || isJunkChunkText(text)) return null
      const source =
        typeof metadata.source === 'string' ? metadata.source : fallbackSource
      if (sourceFilter && source !== sourceFilter) return null
      return {
        text: text.trim(),
        score: typeof row.score === 'number' ? row.score : 0,
        source,
      } satisfies RetrievedChunk
    })
    .filter((row: RetrievedChunk | null): row is RetrievedChunk => row != null)
    .slice(0, topK)
}

/**
 * Retrieve top-K chunks for the marketing assistant.
 * Returns [] on failure so chat can soft-fail to the static prompt.
 */
export async function retrieveMarketingContext(
  query: string,
  topK = MARKETING_RETRIEVE_TOP_K,
): Promise<RetrievedChunk[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  try {
    const store = createMarketingPgVector('marketing-pg-retrieve')
    try {
      const queryVector = await embedQuery(trimmed)
      if (queryVector.length !== MARKETING_EMBEDDING_DIMENSIONS) {
        console.warn(
          `[rag] unexpected embedding dimensions: ${queryVector.length}`,
        )
      }

      const fetchK = Math.min(topK + 4, 20)
      const results = await store.query({
        indexName: MARKETING_ABOUT_INDEX,
        queryVector,
        topK: fetchK,
      })

      return mapQueryResults(results, MARKETING_ABOUT_SOURCE_ID, topK)
    } finally {
      await store.disconnect()
    }
  } catch (err) {
    console.error('[rag] retrieveMarketingContext failed', err)
    return []
  }
}

/**
 * Retrieve top-K portal how-to chunks for the given audience.
 * Soft-fails to [] so chat can rely on PRODUCT FACTS alone.
 */
export async function retrievePortalContext(
  query: string,
  options: { audience: PortalHelpAudience; topK?: number },
): Promise<RetrievedChunk[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const topK = options.topK ?? PORTAL_RETRIEVE_TOP_K
  const sourceFilter = portalHelpSourceForAudience(options.audience)

  try {
    const store = createPortalPgVector('portal-pg-retrieve')
    try {
      const queryVector = await embedQuery(trimmed)
      const fetchK = Math.min(topK + 8, 24)
      const results = await store.query({
        indexName: PORTAL_HELP_INDEX,
        queryVector,
        topK: fetchK,
      })

      return mapQueryResults(results, sourceFilter, topK, sourceFilter)
    } finally {
      await store.disconnect()
    }
  } catch (err) {
    console.error('[rag] retrievePortalContext failed', err)
    return []
  }
}

export function formatRetrievedContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return ''
  return chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] (source: ${chunk.source}, score: ${chunk.score.toFixed(3)})\n${chunk.text}`,
    )
    .join('\n\n')
}
