import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MDocument } from '@mastra/rag'
import { PDFParse } from 'pdf-parse'
import {
  createMarketingPgVector,
  MARKETING_ABOUT_INDEX,
  MARKETING_ABOUT_SOURCE_ID,
  MARKETING_EMBEDDING_DIMENSIONS,
  MARKETING_SITE_PAGES_SOURCE_ID,
} from '../src/rag/constants'
import { cleanPdfText, isJunkChunkText } from '../src/rag/chunk-quality'
import { embedTexts } from '../src/rag/retrieve'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RAG_SOURCES_DIR = path.resolve(__dirname, '../rag-sources')
const DEFAULT_PDF = path.join(RAG_SOURCES_DIR, 'About-COCREATE-RAG-Optimized.pdf')
const DEFAULT_SITE_PAGES = path.join(RAG_SOURCES_DIR, 'site-pages.md')

type PreparedChunk = {
  text: string
  source: string
  chunkIndex: number
}

async function extractPdfText(pdfPath: string): Promise<string> {
  const buffer = await readFile(pdfPath)
  const parser = new PDFParse({ data: buffer })
  try {
    const result = await parser.getText()
    const text = result.text?.trim() ?? ''
    if (!text) {
      throw new Error(`No text extracted from PDF: ${pdfPath}`)
    }
    return text
  } finally {
    await parser.destroy().catch(() => undefined)
  }
}

async function chunkRecursive(
  text: string,
  source: string,
): Promise<PreparedChunk[]> {
  const doc = MDocument.fromText(text)
  const chunks = await doc.chunk({
    strategy: 'recursive',
    maxSize: 512,
    overlap: 50,
  })
  const kept = chunks
    .map((chunk) => chunk.text.trim())
    .filter((chunkText) => !isJunkChunkText(chunkText))
  return kept.map((chunkText, i) => ({
    text: chunkText,
    source,
    chunkIndex: i,
  }))
}

/** Split markdown on ## headings so Contact / Team / Services stay atomic. */
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

async function main() {
  const pdfPath = process.env.RAG_ABOUT_PDF_PATH?.trim() || DEFAULT_PDF
  const sitePagesPath =
    process.env.RAG_SITE_PAGES_PATH?.trim() || DEFAULT_SITE_PAGES

  console.log(`[rag:ingest] reading PDF ${pdfPath}`)
  const rawPdfText = await extractPdfText(pdfPath)
  const pdfText = cleanPdfText(rawPdfText)
  const pdfChunks = await chunkRecursive(pdfText, MARKETING_ABOUT_SOURCE_ID)
  console.log(`[rag:ingest] ${pdfChunks.length} PDF chunks (after clean/filter)`)

  console.log(`[rag:ingest] reading site pages ${sitePagesPath}`)
  const siteText = (await readFile(sitePagesPath, 'utf8')).trim()
  if (!siteText) {
    throw new Error(`Site pages file is empty: ${sitePagesPath}`)
  }
  const siteChunks = chunkMarkdownByHeadings(
    siteText,
    MARKETING_SITE_PAGES_SOURCE_ID,
  )
  console.log(`[rag:ingest] ${siteChunks.length} site-pages section chunks`)

  const allChunks = [...pdfChunks, ...siteChunks]
  if (allChunks.length === 0) {
    throw new Error('Chunking produced zero chunks')
  }

  console.log(`[rag:ingest] ${allChunks.length} total chunks — embedding…`)
  const embeddings = await embedTexts(allChunks.map((chunk) => chunk.text))
  if (embeddings.length !== allChunks.length) {
    throw new Error(
      `Embedding count mismatch: ${embeddings.length} vs ${allChunks.length} chunks`,
    )
  }

  const store = createMarketingPgVector('marketing-pg-ingest')
  try {
    const indexes = await store.listIndexes()
    if (indexes.includes(MARKETING_ABOUT_INDEX)) {
      console.log(`[rag:ingest] deleting existing index ${MARKETING_ABOUT_INDEX}`)
      await store.deleteIndex({ indexName: MARKETING_ABOUT_INDEX })
    }

    console.log(
      `[rag:ingest] creating index ${MARKETING_ABOUT_INDEX} (${MARKETING_EMBEDDING_DIMENSIONS}d)`,
    )
    await store.createIndex({
      indexName: MARKETING_ABOUT_INDEX,
      dimension: MARKETING_EMBEDDING_DIMENSIONS,
    })

    const metadata = allChunks.map((chunk) => ({
      text: chunk.text,
      source: chunk.source,
      chunkIndex: chunk.chunkIndex,
    }))

    await store.upsert({
      indexName: MARKETING_ABOUT_INDEX,
      vectors: embeddings,
      metadata,
    })

    console.log(
      `[rag:ingest] upserted ${embeddings.length} vectors into ${MARKETING_ABOUT_INDEX} ` +
        `(${pdfChunks.length} about PDF + ${siteChunks.length} site-pages)`,
    )
  } finally {
    await store.disconnect()
  }
}

main().catch((err) => {
  console.error('[rag:ingest] failed', err)
  process.exit(1)
})
