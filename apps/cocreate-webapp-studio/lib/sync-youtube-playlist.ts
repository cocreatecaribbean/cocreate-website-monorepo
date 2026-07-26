import type {SanityClient} from 'sanity'
import {
  episodeDocumentId,
  fetchYouTubePlaylistItems,
  slugifyEpisodeTitle,
} from './youtube-playlist'

export function getYouTubeApiKey(): string | undefined {
  return (
    process.env.SANITY_STUDIO_YOUTUBE_API_KEY?.trim() ||
    process.env.YOUTUBE_API_KEY?.trim() ||
    undefined
  )
}

export type SyncYouTubePlaylistParams = {
  client: SanityClient
  /** Document id currently open in Studio (draft or published). */
  documentId: string
  playlistId: string
}

export type SyncYouTubePlaylistResult = {
  episodeCount: number
}

function publishedIdOf(id: string): string {
  return id.replace(/^drafts\./, '')
}

export async function syncYouTubePlaylist({
  client,
  documentId,
  playlistId,
}: SyncYouTubePlaylistParams): Promise<SyncYouTubePlaylistResult> {
  const apiKey = getYouTubeApiKey()
  if (!apiKey) {
    throw new Error(
      'Missing SANITY_STUDIO_YOUTUBE_API_KEY (or YOUTUBE_API_KEY) in the Studio environment.',
    )
  }

  const items = await fetchYouTubePlaylistItems(playlistId, apiKey)
  if (!items.length) {
    throw new Error('Playlist returned no videos.')
  }

  const parentId = publishedIdOf(documentId)
  const existingByVideoId = new Map<string, {_id: string; mediaSource?: string}>()
  const existing = await client.fetch<
    Array<{_id: string; youtubeVideoId?: string; mediaSource?: string}>
  >(
    `*[_type == "originalEpisode" && parent._ref == $parentId]{_id, youtubeVideoId, "mediaSource": media.mediaSource}`,
    {parentId},
  )
  for (const row of existing) {
    const key = row.youtubeVideoId
    if (!key) continue
    // Always store published ids so refs never point at drafts.*
    const publishedId = publishedIdOf(row._id)
    const prev = existingByVideoId.get(key)
    existingByVideoId.set(key, {
      _id: publishedId,
      mediaSource: row.mediaSource ?? prev?.mediaSource,
    })
  }

  const episodeRefs: Array<{
    _type: 'reference'
    _ref: string
    _key: string
    _weak: true
  }> = []

  for (const [index, item] of items.entries()) {
    const docId = publishedIdOf(
      existingByVideoId.get(item.videoId)?._id ?? episodeDocumentId(item.videoId),
    )
    const existingMediaSource = existingByVideoId.get(item.videoId)?.mediaSource
    const preserveMux = existingMediaSource === 'muxVideo'

    const baseFields = {
      _id: docId,
      _type: 'originalEpisode' as const,
      title: item.title,
      slug: {_type: 'slug' as const, current: slugifyEpisodeTitle(item.title, item.videoId)},
      episodeNumber: index + 1,
      description: item.description || undefined,
      publishedAt: item.publishedAt || undefined,
      youtubeVideoId: item.videoId,
      parent: {_type: 'reference' as const, _ref: parentId, _weak: true as const},
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
    } else {
      await client.createOrReplace({
        ...baseFields,
        media: {
          _type: 'originalMedia',
          mediaSource: 'youtube',
          youtubeVideoId: item.videoId,
        },
      })
    }

    episodeRefs.push({
      _type: 'reference',
      _ref: docId,
      _key: item.videoId,
      _weak: true,
    })
  }

  await client
    .patch(documentId)
    .set({
      'podcastSeries.episodes': episodeRefs,
      'podcastSeries.lastSyncedAt': new Date().toISOString(),
    })
    .commit({autoGenerateArrayKeys: true})

  return {episodeCount: items.length}
}
