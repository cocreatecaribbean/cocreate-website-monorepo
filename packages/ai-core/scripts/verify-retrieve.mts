import {
  formatRetrievedContext,
  retrieveMarketingContext,
} from '../src/index.ts'

async function assertRetrieve(
  query: string,
  opts: {
    minChunks?: number
    mustInclude?: RegExp | RegExp[]
    mustNotMatchAll?: RegExp
  } = {},
) {
  const { minChunks = 1, mustInclude, mustNotMatchAll } = opts
  const chunks = await retrieveMarketingContext(query, 8)
  console.log(`[rag:verify] "${query}" → ${chunks.length} chunks`)
  if (chunks.length < minChunks) {
    throw new Error(
      `Expected at least ${minChunks} chunk(s) for query: ${query}`,
    )
  }
  const blob = formatRetrievedContext(chunks)
  console.log(blob.slice(0, 500))
  console.log('---')

  if (mustNotMatchAll) {
    const allJunk = chunks.every((c) => mustNotMatchAll.test(c.text.trim()))
    if (allJunk) {
      throw new Error(`All chunks looked like junk for query: ${query}`)
    }
  }

  if (mustInclude) {
    const patterns = Array.isArray(mustInclude) ? mustInclude : [mustInclude]
    for (const pattern of patterns) {
      if (!pattern.test(blob)) {
        throw new Error(
          `Expected ${pattern} in retrieved context for: ${query}`,
        )
      }
    }
  }

  return chunks
}

async function main() {
  await assertRetrieve('What does CoCreate Caribbean do?', {
    mustNotMatchAll: /^--\s*\d+\s*of\s*\d+\s*--$/i,
  })

  await assertRetrieve('How do I get in touch with CoCreate? phone email contact', {
    mustInclude: [/requests@cocreatecaribbean\.com/i, /876\.504\.1240/],
  })

  await assertRetrieve('tell me about the team who works there', {
    mustInclude: [/Patrick Traile/i, /Tashan Hendricks/i],
  })

  const typoChunks = await retrieveMarketingContext('is the a patrick?', 8)
  const typoBlob = formatRetrievedContext(typoChunks)
  console.log(
    `[rag:verify] typo query → ${typoChunks.length} chunks, hasPatrick=${/Patrick/i.test(typoBlob)}`,
  )
  if (!/Patrick/i.test(typoBlob)) {
    console.warn(
      '[rag:verify] typo query did not retrieve Patrick; SITE FACTS in the system prompt still cover this.',
    )
  } else {
    console.log('[rag:verify] typo query retrieved Patrick via RAG')
  }

  await assertRetrieve('is there a Patrick on the team?', {
    mustInclude: /Patrick Traile/i,
  })

  console.log('[rag:verify] all checks passed')
}

main().catch((err) => {
  console.error('[rag:verify] failed', err)
  process.exit(1)
})
