/**
 * One-time migration: flatten legacy `youtubeVideoId` on originals into
 * `contentKind: 'film'` + `film.media` YouTube media.
 *
 * Usage:
 *   pnpm --filter @cocreate/studio migrate:originals-film
 */

import {createClient} from '@sanity/client'

async function main() {
  const token =
    process.env.SANITY_API_WRITE_TOKEN?.trim() || process.env.SANITY_API_TOKEN?.trim()
  const projectId =
    process.env.SANITY_STUDIO_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()
  const dataset =
    process.env.SANITY_STUDIO_DATASET?.trim() ||
    process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() ||
    'dev'

  if (!token || !projectId) {
    console.error('Missing Sanity projectId / write token')
    process.exit(1)
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: '2025-01-01',
    token,
    useCdn: false,
  })

  const docs = await client.fetch<
    Array<{
      _id: string
      contentKind?: string
      youtubeVideoId?: string
      film?: {media?: {youtubeVideoId?: string}} | null
    }>
  >(
    `*[_type == "original" && defined(youtubeVideoId) && youtubeVideoId != ""]{_id, contentKind, youtubeVideoId, film}`,
  )

  console.log(`Found ${docs.length} legacy originals with youtubeVideoId`)

  for (const doc of docs) {
    if (doc.film?.media?.youtubeVideoId) {
      console.log(`  skip ${doc._id} (already has film.media)`)
      continue
    }

    await client
      .patch(doc._id)
      .set({
        contentKind: doc.contentKind || 'film',
        film: {
          _type: 'filmContent',
          media: {
            _type: 'originalMedia',
            mediaSource: 'youtube',
            youtubeVideoId: doc.youtubeVideoId,
          },
        },
      })
      .commit()

    console.log(`  migrated ${doc._id}`)
  }

  console.log('Done.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
