export const YOUTUBE_VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/
/** YouTube playlist IDs vary — newer are long; older can be short (e.g. PLC2BjL_MrFRw). */
export const YOUTUBE_PLAYLIST_ID_PATTERN = /^PL[\w-]{10,}$/i

export function extractYouTubeVideoId(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (YOUTUBE_VIDEO_ID_PATTERN.test(trimmed)) return trimmed

  try {
    const url = new URL(trimmed)
    const host = url.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      if (id && YOUTUBE_VIDEO_ID_PATTERN.test(id)) return id
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const fromQuery = url.searchParams.get('v')
      if (fromQuery && YOUTUBE_VIDEO_ID_PATTERN.test(fromQuery)) return fromQuery

      const parts = url.pathname.split('/').filter(Boolean)
      if (
        (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') &&
        parts[1] &&
        YOUTUBE_VIDEO_ID_PATTERN.test(parts[1])
      ) {
        return parts[1]
      }
    }
  } catch {
    // not a URL
  }

  const urlPatterns = [
    /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of urlPatterns) {
    const match = trimmed.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

export function extractYouTubePlaylistId(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (YOUTUBE_PLAYLIST_ID_PATTERN.test(trimmed)) return trimmed

  try {
    const url = new URL(trimmed)
    const list = url.searchParams.get('list')
    if (list && YOUTUBE_PLAYLIST_ID_PATTERN.test(list)) return list
  } catch {
    // not a URL
  }

  const match = trimmed.match(/[?&]list=(PL[\w-]{10,})/i)
  return match?.[1] ?? null
}

export function youtubeVideoFieldError(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (YOUTUBE_VIDEO_ID_PATTERN.test(trimmed)) return null

  if (extractYouTubePlaylistId(trimmed) || YOUTUBE_PLAYLIST_ID_PATTERN.test(trimmed)) {
    return 'This is a playlist — use the podcast series “YouTube playlist” field instead'
  }

  if (extractYouTubeVideoId(trimmed)) return null

  return 'Couldn’t extract a valid YouTube video ID. Paste a watch/youtu.be/shorts URL or an 11-character video ID'
}

export function youtubePlaylistFieldError(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (YOUTUBE_PLAYLIST_ID_PATTERN.test(trimmed)) return null

  if (extractYouTubeVideoId(trimmed) || YOUTUBE_VIDEO_ID_PATTERN.test(trimmed)) {
    return 'This is a video — podcast series needs a playlist URL with list=PL… (or a PL… playlist ID)'
  }

  if (extractYouTubePlaylistId(trimmed)) return null

  return 'Couldn’t extract a valid playlist ID. Paste a playlist URL (list=PL…) or a PL… playlist ID'
}
