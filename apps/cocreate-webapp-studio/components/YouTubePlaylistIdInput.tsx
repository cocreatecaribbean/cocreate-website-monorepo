import {useCallback, useState} from 'react'
import {Button, Stack, Text, TextInput} from '@sanity/ui'
import {set, unset, useClient, useFormValue, type StringInputProps} from 'sanity'
import {
  extractYouTubePlaylistId,
  YOUTUBE_PLAYLIST_ID_PATTERN,
  youtubePlaylistFieldError,
} from '../lib/youtube-ids'
import {getYouTubeApiKey, syncYouTubePlaylist} from '../lib/sync-youtube-playlist'

export function YouTubePlaylistIdInput(props: StringInputProps) {
  const {value, onChange, elementProps, readOnly} = props
  const client = useClient({apiVersion: '2025-01-01'})
  const documentId = useFormValue(['_id']) as string | undefined
  const syncEnabled = useFormValue(['podcastSeries', 'syncEnabled']) as boolean | undefined
  const [busy, setBusy] = useState(false)

  const id = typeof value === 'string' ? value : ''
  const isValid = !id || YOUTUBE_PLAYLIST_ID_PATTERN.test(id)
  const error = id && !isValid ? youtubePlaylistFieldError(id) : null
  const allowSync = syncEnabled !== false
  const hasApiKey = Boolean(getYouTubeApiKey())

  const onSync = useCallback(async () => {
    if (!documentId) {
      window.alert('Save the document first, then sync.')
      return
    }
    if (!id || !YOUTUBE_PLAYLIST_ID_PATTERN.test(id)) {
      window.alert('Add a valid YouTube playlist ID before syncing.')
      return
    }
    if (!allowSync) {
      window.alert('Playlist sync is disabled on this original.')
      return
    }
    if (!hasApiKey) {
      window.alert(
        'Missing SANITY_STUDIO_YOUTUBE_API_KEY (or YOUTUBE_API_KEY) in the Studio environment.',
      )
      return
    }

    setBusy(true)
    try {
      const {episodeCount} = await syncYouTubePlaylist({
        client,
        documentId,
        playlistId: id,
      })
      window.alert(
        `Synced ${episodeCount} episode${episodeCount === 1 ? '' : 's'} from YouTube. Check Presentation to preview. Set Published at and Publish when ready for the public site.`,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      window.alert(`YouTube sync failed: ${message}`)
    } finally {
      setBusy(false)
    }
  }, [allowSync, client, documentId, hasApiKey, id])

  return (
    <Stack space={3}>
      <TextInput
        {...elementProps}
        readOnly={readOnly}
        value={id}
        placeholder="Paste a YouTube playlist URL or playlist ID (PL…)"
        onChange={(event) => {
          const raw = event.currentTarget.value
          const extracted = extractYouTubePlaylistId(raw)
          if (!raw.trim()) {
            onChange(unset())
            return
          }
          onChange(set(extracted ?? raw.trim()))
        }}
      />
      {id && isValid ? (
        <Text size={1} muted>
          Playlist ID stored: {id}
        </Text>
      ) : null}
      {error ? (
        <Text size={1} style={{color: 'var(--card-badge-critical-fg-color)'}}>
          {error}
        </Text>
      ) : null}
      {id && isValid ? (
        <Stack space={2}>
          <Button
            text={busy ? 'Syncing…' : 'Sync YouTube playlist'}
            tone="primary"
            mode="ghost"
            disabled={Boolean(readOnly) || busy || !allowSync || !documentId}
            onClick={onSync}
          />
          {!allowSync ? (
            <Text size={1} muted>
              Sync is disabled — turn on “Allow playlist sync” above.
            </Text>
          ) : !hasApiKey ? (
            <Text size={1} muted>
              Set SANITY_STUDIO_YOUTUBE_API_KEY in the Studio environment to sync.
            </Text>
          ) : (
            <Text size={1} muted>
              Imports / updates episodes from this playlist into the Episodes list below.
            </Text>
          )}
        </Stack>
      ) : null}
    </Stack>
  )
}
