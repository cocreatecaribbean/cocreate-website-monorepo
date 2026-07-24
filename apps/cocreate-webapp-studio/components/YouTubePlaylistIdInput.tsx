import {Stack, Text, TextInput} from '@sanity/ui'
import {set, unset, type StringInputProps} from 'sanity'

const PLAYLIST_ID_PATTERN = /^PL[\w-]{16,}$/i

function extractPlaylistId(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (PLAYLIST_ID_PATTERN.test(trimmed)) return trimmed

  try {
    const url = new URL(trimmed)
    const list = url.searchParams.get('list')
    if (list && PLAYLIST_ID_PATTERN.test(list)) return list
  } catch {
    // not a URL
  }

  const match = trimmed.match(/[?&]list=(PL[\w-]{16,})/i)
  return match?.[1] ?? null
}

export function YouTubePlaylistIdInput(props: StringInputProps) {
  const {value, onChange, elementProps, readOnly} = props
  const id = typeof value === 'string' ? value : ''
  const isValid = !id || PLAYLIST_ID_PATTERN.test(id)

  return (
    <Stack space={3}>
      <TextInput
        {...elementProps}
        readOnly={readOnly}
        value={id}
        placeholder="Paste a YouTube playlist URL or playlist ID (PL…)"
        onChange={(event) => {
          const raw = event.currentTarget.value
          const extracted = extractPlaylistId(raw)
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
      {id && !isValid ? (
        <Text size={1} style={{color: 'var(--card-badge-critical-fg-color)'}}>
          Enter a valid YouTube playlist ID or URL (list=PL…)
        </Text>
      ) : null}
    </Stack>
  )
}
