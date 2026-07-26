import {Stack, Text, TextInput} from '@sanity/ui'
import {set, unset, type StringInputProps} from 'sanity'
import {
  extractYouTubeVideoId,
  YOUTUBE_VIDEO_ID_PATTERN,
  youtubeVideoFieldError,
} from '../lib/youtube-ids'

export function YouTubeVideoIdInput(props: StringInputProps) {
  const {value, onChange, elementProps, readOnly} = props
  const id = typeof value === 'string' ? value : ''
  const isValid = !id || YOUTUBE_VIDEO_ID_PATTERN.test(id)
  const error = id && !isValid ? youtubeVideoFieldError(id) : null

  return (
    <Stack space={3}>
      <TextInput
        {...elementProps}
        readOnly={readOnly}
        value={id}
        placeholder="Paste a YouTube URL or 11-character video ID"
        onChange={(event) => {
          const raw = event.currentTarget.value
          const extracted = extractYouTubeVideoId(raw)
          if (!raw.trim()) {
            onChange(unset())
            return
          }
          onChange(set(extracted ?? raw.trim()))
        }}
      />
      {id && isValid ? (
        <Text size={1} muted>
          Embed preview: youtube-nocookie.com/embed/{id}
        </Text>
      ) : null}
      {error ? (
        <Text size={1} style={{color: 'var(--card-badge-critical-fg-color)'}}>
          {error}
        </Text>
      ) : null}
    </Stack>
  )
}
