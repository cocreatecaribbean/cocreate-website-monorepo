import {useCallback, useState} from 'react'
import {useClient, type DocumentActionComponent} from 'sanity'
import {getYouTubeApiKey, syncYouTubePlaylist} from '../lib/sync-youtube-playlist'

type PodcastSeriesFields = {
  youtubePlaylistId?: string
  syncEnabled?: boolean
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

    if (!getYouTubeApiKey()) {
      window.alert(
        'Missing SANITY_STUDIO_YOUTUBE_API_KEY (or YOUTUBE_API_KEY) in the Studio environment.',
      )
      return
    }

    setBusy(true)
    try {
      const {episodeCount} = await syncYouTubePlaylist({
        client,
        documentId: id,
        playlistId,
      })
      window.alert(
        `Synced ${episodeCount} episode${episodeCount === 1 ? '' : 's'} from YouTube. Check Presentation to preview. Set Published at and Publish when ready for the public site.`,
      )
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
