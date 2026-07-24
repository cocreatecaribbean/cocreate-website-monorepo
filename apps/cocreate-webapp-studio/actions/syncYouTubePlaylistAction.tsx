import {useCallback, useState} from 'react'
import {useClient, type DocumentActionComponent} from 'sanity'
import {
  episodeDocumentId,
  fetchYouTubePlaylistItems,
  slugifyEpisodeTitle,
} from '../lib/youtube-playlist'

type PodcastSeriesFields = {
  youtubePlaylistId?: string
  syncEnabled?: boolean
}

function getYouTubeApiKey(): string | undefined {
  return (
    process.env.SANITY_STUDIO_YOUTUBE_API_KEY?.trim() ||
    process.env.YOUTUBE_API_KEY?.trim() ||
    undefined
  )
}

export const syncYouTubePlaylistAction: DocumentActionComponent = (props) => {
  const {id, type, draft, published, onComplete} = props
  const doc = draft || published
  const client = useClient({apiVersion: '2025-01-01'})
  const [busy, setBusy] = useState(false)

  const contentKind = doc?.contentKind as string | undefined
  const podcast = doc?.podcastSeries as PodcastSeriesFields | undefined
  const playlistId = podcast?.youtubePlaylistId?.trim()
  const syncEnabled = podcast?.syncEnabled !== false

  const onHandle = useCallback(async () => {
    if (!playlistId) {
      window.alert('Add a YouTube playlist ID before syncing.')
      return
    }
    if (!syncEnabled) {
      window.alert('Playlist sync is disabled on this original.')
      return
    }

    const apiKey = getYouTubeApiKey()
    if (!apiKey) {
      window.alert(
        'Missing SANITY_STUDIO_YOUTUBE_API_KEY (or YOUTUBE_API_KEY) in the Studio environment.',
      )
      return
    }

    setBusy(true)
    try {
      const items = await fetchYouTubePlaylistItems(playlistId, apiKey)
      if (!items.length) {
        window.alert('Playlist returned no videos.')
        return
      }

      const parentId = id.replace(/^drafts\./, '')
      const existingByVideoId = new Map<string, {_id: string; mediaSource?: string}>()
      const existing = await client.fetch<
        Array<{_id: string; youtubeVideoId?: string; mediaSource?: string}>
      >(
        `*[_type == "originalEpisode" && parent._ref == $parentId]{_id, youtubeVideoId, "mediaSource": media.mediaSource}`,
        {parentId},
      )
      for (const row of existing) {
        const key = row.youtubeVideoId
        if (key) existingByVideoId.set(key, {_id: row._id, mediaSource: row.mediaSource})
      }

      const episodeRefs: Array<{_type: 'reference'; _ref: string; _key: string}> = []

      for (const [index, item] of items.entries()) {
        const docId = existingByVideoId.get(item.videoId)?._id ?? episodeDocumentId(item.videoId)
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
          parent: {_type: 'reference' as const, _ref: parentId, _weak: true},
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
        })
      }

      // Patch the open document (draft or published id from the action context).
      await client
        .patch(id)
        .set({
          'podcastSeries.episodes': episodeRefs,
          'podcastSeries.lastSyncedAt': new Date().toISOString(),
        })
        .commit({autoGenerateArrayKeys: true})

      window.alert(`Synced ${items.length} episode${items.length === 1 ? '' : 's'} from YouTube.`)
      onComplete()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      window.alert(`YouTube sync failed: ${message}`)
    } finally {
      setBusy(false)
    }
  }, [client, id, onComplete, playlistId, syncEnabled])

  if (type !== 'original' || contentKind !== 'podcastSeries') {
    return null
  }

  return {
    label: busy ? 'Syncing…' : 'Sync YouTube playlist',
    disabled: busy || !playlistId || !syncEnabled,
    title: !playlistId
      ? 'Add a playlist ID first'
      : !syncEnabled
        ? 'Sync is disabled'
        : 'Import / update episodes from the YouTube playlist',
    onHandle,
  }
}
