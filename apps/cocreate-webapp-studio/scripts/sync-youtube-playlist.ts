/**
 * Sync a Sanity podcast-series original from its YouTube playlist.
 *
 * Usage (from repo root, with Doppler or env set):
 *   pnpm --filter @cocreate/studio sync:youtube-playlist -- <originalDocumentId>
 *
 * Env:
 *   YOUTUBE_API_KEY or SANITY_STUDIO_YOUTUBE_API_KEY
 *   SANITY_API_WRITE_TOKEN (or SANITY_API_TOKEN with write access)
 *   SANITY_STUDIO_PROJECT_ID / NEXT_PUBLIC_SANITY_PROJECT_ID
 *   SANITY_STUDIO_DATASET / NEXT_PUBLIC_SANITY_DATASET
 */

import {createClient} from '@sanity/client'
import {
  episodeDocumentId,
  fetchYouTubePlaylistItems,
  slugifyEpisodeTitle,
} from '../lib/youtube-playlist'

async function main() {
  const originalId = process.argv[2]?.replace(/^drafts\./, '')
  if (!originalId) {
    console.error('Usage: sync:youtube-playlist <originalDocumentId>')
    process.exit(1)
  }

  const apiKey =
    process.env.SANITY_STUDIO_YOUTUBE_API_KEY?.trim() || process.env.YOUTUBE_API_KEY?.trim()
  const token =
    process.env.SANITY_API_WRITE_TOKEN?.trim() || process.env.SANITY_API_TOKEN?.trim()
  const projectId =
    process.env.SANITY_STUDIO_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim()
  const dataset =
    process.env.SANITY_STUDIO_DATASET?.trim() ||
    process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() ||
    'dev'

  if (!apiKey) {
    console.error('Missing YOUTUBE_API_KEY / SANITY_STUDIO_YOUTUBE_API_KEY')
    process.exit(1)
  }
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

  const original = await client.fetch<{
    _id: string
    contentKind?: string
    podcastSeries?: {
      youtubePlaylistId?: string
      syncEnabled?: boolean
    }
  } | null>(
    `*[_type == "original" && _id == $id][0]{_id, contentKind, podcastSeries}`,
    {id: originalId},
  )

  if (!original) {
    console.error(`Original not found: ${originalId}`)
    process.exit(1)
  }
  if (original.contentKind !== 'podcastSeries') {
    console.error(`Original ${originalId} is not a podcastSeries (got ${original.contentKind})`)
    process.exit(1)
  }

  const playlistId = original.podcastSeries?.youtubePlaylistId?.trim()
  if (!playlistId) {
    console.error('No youtubePlaylistId on this original')
    process.exit(1)
  }
  if (original.podcastSeries?.syncEnabled === false) {
    console.error('syncEnabled is false')
    process.exit(1)
  }

  console.log(`Fetching playlist ${playlistId}…`)
  const items = await fetchYouTubePlaylistItems(playlistId, apiKey)
  console.log(`Found ${items.length} videos`)

  const existing = await client.fetch<
    Array<{_id: string; youtubeVideoId?: string; mediaSource?: string}>
  >(
    `*[_type == "originalEpisode" && parent._ref == $parentId]{_id, youtubeVideoId, "mediaSource": media.mediaSource}`,
    {parentId: originalId},
  )
  const existingByVideoId = new Map(
    existing
      .filter((row) => row.youtubeVideoId)
      .map((row) => [row.youtubeVideoId as string, row]),
  )

  const episodeRefs: Array<{_type: 'reference'; _ref: string; _key: string}> = []

  for (const [index, item] of items.entries()) {
    const existingRow = existingByVideoId.get(item.videoId)
    const docId = existingRow?._id ?? episodeDocumentId(item.videoId)
    const preserveMux = existingRow?.mediaSource === 'muxVideo'

    const baseFields = {
      _id: docId,
      _type: 'originalEpisode' as const,
      title: item.title,
      slug: {_type: 'slug' as const, current: slugifyEpisodeTitle(item.title, item.videoId)},
      episodeNumber: index + 1,
      description: item.description || undefined,
      publishedAt: item.publishedAt || undefined,
      youtubeVideoId: item.videoId,
      parent: {_type: 'reference' as const, _ref: originalId, _weak: true},
    }

    if (preserveMux) {
      await client
        .patch(docId)
        .set({
          title: baseFields.title,
          slug: baseFields.slug,
          episodeNumber: baseFields.episodeNumber,
          description: baseFields.description,
          publishedAt: baseFields.publishedAt,
          youtubeVideoId: baseFields.youtubeVideoId,
          parent: baseFields.parent,
        })
        .commit()
      console.log(`  updated (mux preserved) ${docId}`)
    } else {
      await client.createOrReplace({
        ...baseFields,
        media: {
          _type: 'originalMedia',
          mediaSource: 'youtube',
          youtubeVideoId: item.videoId,
        },
      })
      console.log(`  upserted ${docId}`)
    }

    episodeRefs.push({_type: 'reference', _ref: docId, _key: item.videoId})
  }

  await client
    .patch(originalId)
    .set({
      'podcastSeries.episodes': episodeRefs,
      'podcastSeries.lastSyncedAt': new Date().toISOString(),
    })
    .commit({autoGenerateArrayKeys: true})

  console.log(`Done. Linked ${episodeRefs.length} episodes on ${originalId}.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
