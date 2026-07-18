import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createPortalPgVector,
  MARKETING_EMBEDDING_DIMENSIONS,
  PORTAL_HELP_ADMIN_SOURCE_ID,
  PORTAL_HELP_CLIENT_SOURCE_ID,
  PORTAL_HELP_INDEX,
} from '../src/rag/constants'
import { isJunkChunkText } from '../src/rag/chunk-quality'
import { embedTexts } from '../src/rag/retrieve'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORTAL_DIR = path.resolve(__dirname, '../rag-sources/portal')

type PreparedChunk = {
  text: string
  source: string
  chunkIndex: number
}

function chunkMarkdownByHeadings(
  markdown: string,
  source: string,
): PreparedChunk[] {
  const sections: string[] = []
  let current = ''

  for (const line of markdown.split(/\r?\n/)) {
    if (/^##\s+/.test(line) && current.trim()) {
      sections.push(current.trim())
      current = `${line}\n`
    } else {
      current += `${line}\n`
    }
  }
  if (current.trim()) sections.push(current.trim())

  const kept = sections.filter((section) => !isJunkChunkText(section))
  return kept.map((text, i) => ({
    text,
    source,
    chunkIndex: i,
  }))
}

async function loadSource(
  filename: string,
  source: string,
): Promise<PreparedChunk[]> {
  const filePath = path.join(PORTAL_DIR, filename)
  console.log(`[rag:ingest-portal] reading ${filePath}`)
  const text = (await readFile(filePath, 'utf8')).trim()
  if (!text) throw new Error(`Portal help file is empty: ${filePath}`)
  const chunks = chunkMarkdownByHeadings(text, source)
  console.log(`[rag:ingest-portal] ${chunks.length} chunks from ${source}`)
  return chunks
}

async function main() {
  const clientChunks = await loadSource(
    'client-portal-help.md',
    PORTAL_HELP_CLIENT_SOURCE_ID,
  )
  const adminChunks = await loadSource(
    'admin-center-help.md',
    PORTAL_HELP_ADMIN_SOURCE_ID,
  )
  const allChunks = [...clientChunks, ...adminChunks]
  if (allChunks.length === 0) {
    throw new Error('Portal ingest produced zero chunks')
  }

  console.log(`[rag:ingest-portal] ${allChunks.length} total — embedding…`)
  const embeddings = await embedTexts(allChunks.map((chunk) => chunk.text))
  if (embeddings.length !== allChunks.length) {
    throw new Error(
      `Embedding count mismatch: ${embeddings.length} vs ${allChunks.length}`,
    )
  }

  const store = createPortalPgVector('portal-pg-ingest')
  try {
    const indexes = await store.listIndexes()
    if (indexes.includes(PORTAL_HELP_INDEX)) {
      console.log(`[rag:ingest-portal] deleting existing index ${PORTAL_HELP_INDEX}`)
      await store.deleteIndex({ indexName: PORTAL_HELP_INDEX })
    }

    console.log(
      `[rag:ingest-portal] creating index ${PORTAL_HELP_INDEX} (${MARKETING_EMBEDDING_DIMENSIONS}d)`,
    )
    await store.createIndex({
      indexName: PORTAL_HELP_INDEX,
      dimension: MARKETING_EMBEDDING_DIMENSIONS,
    })

    await store.upsert({
      indexName: PORTAL_HELP_INDEX,
      vectors: embeddings,
      metadata: allChunks.map((chunk) => ({
        text: chunk.text,
        source: chunk.source,
        chunkIndex: chunk.chunkIndex,
      })),
    })

    console.log(
      `[rag:ingest-portal] upserted ${embeddings.length} vectors ` +
        `(${clientChunks.length} client + ${adminChunks.length} admin)`,
    )
  } finally {
    await store.disconnect()
  }
}

main().catch((err) => {
  console.error('[rag:ingest-portal] failed', err)
  process.exit(1)
})
