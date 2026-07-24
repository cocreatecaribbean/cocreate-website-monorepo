export type YouTubePlaylistItem = {
  videoId: string
  title: string
  description: string
  publishedAt: string | null
  thumbnailUrl: string | null
  position: number
}

type PlaylistItemsResponse = {
  nextPageToken?: string
  items?: Array<{
    snippet?: {
      title?: string
      description?: string
      publishedAt?: string
      position?: number
      resourceId?: {videoId?: string}
      thumbnails?: {
        maxres?: {url?: string}
        standard?: {url?: string}
        high?: {url?: string}
        medium?: {url?: string}
        default?: {url?: string}
      }
    }
  }>
  error?: {message?: string}
}

function pickThumbnail(
  thumbs: NonNullable<NonNullable<PlaylistItemsResponse['items']>[number]['snippet']>['thumbnails'],
): string | null {
  return (
    thumbs?.maxres?.url ||
    thumbs?.standard?.url ||
    thumbs?.high?.url ||
    thumbs?.medium?.url ||
    thumbs?.default?.url ||
    null
  )
}

/** Fetch all public playlist items via YouTube Data API v3. */
export async function fetchYouTubePlaylistItems(
  playlistId: string,
  apiKey: string,
): Promise<YouTubePlaylistItem[]> {
  const items: YouTubePlaylistItem[] = []
  let pageToken: string | undefined

  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems')
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('playlistId', playlistId)
    url.searchParams.set('maxResults', '50')
    url.searchParams.set('key', apiKey)
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    const res = await fetch(url.toString())
    const data = (await res.json()) as PlaylistItemsResponse
    if (!res.ok) {
      throw new Error(data.error?.message || `YouTube API error (${res.status})`)
    }

    for (const item of data.items ?? []) {
      const videoId = item.snippet?.resourceId?.videoId
      if (!videoId) continue
      items.push({
        videoId,
        title: item.snippet?.title?.trim() || `Episode ${videoId}`,
        description: item.snippet?.description?.trim() || '',
        publishedAt: item.snippet?.publishedAt ?? null,
        thumbnailUrl: pickThumbnail(item.snippet?.thumbnails),
        position: typeof item.snippet?.position === 'number' ? item.snippet.position : items.length,
      })
    }

    pageToken = data.nextPageToken
  } while (pageToken)

  return items.sort((a, b) => a.position - b.position)
}

export function slugifyEpisodeTitle(title: string, videoId: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return base || `episode-${videoId}`
}

export function episodeDocumentId(videoId: string): string {
  return `originalEpisode-${videoId}`
}
