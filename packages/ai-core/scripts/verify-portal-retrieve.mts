import {
  formatRetrievedContext,
  retrievePortalContext,
} from '../src/index.ts'

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function assertRetrieve(
  query: string,
  audience: 'client-portal' | 'admin-center',
  mustInclude: RegExp | RegExp[],
) {
  let chunks = await retrievePortalContext(query, { audience, topK: 8 })
  if (chunks.length < 1) {
    await sleep(2000)
    chunks = await retrievePortalContext(query, { audience, topK: 8 })
  }
  console.log(`[rag:verify-portal] [${audience}] "${query}" → ${chunks.length}`)
  if (chunks.length < 1) {
    throw new Error(`Expected chunks for ${audience}: ${query}`)
  }
  const blob = formatRetrievedContext(chunks)
  console.log(blob.slice(0, 450))
  console.log('---')
  const patterns = Array.isArray(mustInclude) ? mustInclude : [mustInclude]
  for (const pattern of patterns) {
    if (!pattern.test(blob)) {
      throw new Error(`Expected ${pattern} for ${audience}: ${query}`)
    }
  }
  await sleep(800)
}

async function main() {
  await assertRetrieve(
    'Where do I message CoCreate or get help?',
    'client-portal',
    [/Get Help/i, /ccView=messages/],
  )
  await assertRetrieve(
    'Who can invite teammates?',
    'client-portal',
    [/Admin/i, /Team/i],
  )
  await assertRetrieve(
    'What is Social Listening?',
    'client-portal',
    [/Social Listening/i],
  )

  await assertRetrieve(
    'Where do I answer a client Get Help message?',
    'admin-center',
    [/Get Help/i, /\/messages/],
  )
  await assertRetrieve(
    'Who invites new agency admins?',
    'admin-center',
    [/Super admin/i, /Team/i],
  )
  await assertRetrieve(
    'How do I enable Social Listening for a client?',
    'admin-center',
    [/Social Listening/i, /Clients/i],
  )

  console.log('[rag:verify-portal] all checks passed')
}

main().catch((err) => {
  console.error('[rag:verify-portal] failed', err)
  process.exit(1)
})
