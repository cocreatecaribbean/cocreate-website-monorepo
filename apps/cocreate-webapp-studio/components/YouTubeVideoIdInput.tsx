import { Stack, Text, TextInput } from '@sanity/ui'
import { set, unset, type StringInputProps } from 'sanity'

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/

function extractYouTubeId(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (YOUTUBE_ID_PATTERN.test(trimmed)) return trimmed

  const urlPatterns = [
    /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of urlPatterns) {
    const match = trimmed.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

export function YouTubeVideoIdInput(props: StringInputProps) {
  const { value, onChange, elementProps, readOnly } = props
  const id = typeof value === 'string' ? value : ''
  const isValid = !id || YOUTUBE_ID_PATTERN.test(id)

  return (
    <Stack space={3}>
      <TextInput
        {...elementProps}
        readOnly={readOnly}
        value={id}
        placeholder="Paste a YouTube URL or 11-character video ID"
        onChange={(event) => {
          const raw = event.currentTarget.value
          const extracted = extractYouTubeId(raw)
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
      {id && !isValid ? (
        <Text size={1} style={{ color: 'var(--card-badge-critical-fg-color)' }}>
          Enter a valid YouTube video ID or URL
        </Text>
      ) : null}
    </Stack>
  )
}
