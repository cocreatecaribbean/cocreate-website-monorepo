import type { OriginalDetail, OriginalPreview } from '@cocreate/types'
import { stegaClean } from '@sanity/client/stega'
import {
  mapSanityOriginalToDetail,
  mapSanityOriginalToPreview,
} from '@/sanity/lib/mappers'

const originalMediaProj = /* groq */ `
  "mediaSource": mediaSource,
  "youtubeVideoId": youtubeVideoId,
  "playbackId": muxVideo.asset->playbackId,
  "posterUrl": poster.asset->url
`

const originalBrandFillProjection = /* groq */ `
  videoTitleFillMode,
  videoTitleSolidColor,
  videoTitleGradientFrom,
  videoTitleGradientVia,
  videoTitleGradientTo,
  videoTitleGradientAngle,
  playlistSidebarFillMode,
  playlistSidebarSolidColor,
  playlistSidebarGradientFrom,
  playlistSidebarGradientVia,
  playlistSidebarGradientTo,
  playlistSidebarGradientAngle,
  playlistSelectedFillMode,
  playlistSelectedSolidColor,
  playlistSelectedGradientFrom,
  playlistSelectedGradientVia,
  playlistSelectedGradientTo,
  playlistSelectedGradientAngle,
  watchButtonFillMode,
  watchButtonSolidColor,
  watchButtonGradientFrom,
  watchButtonGradientVia,
  watchButtonGradientTo,
  watchButtonGradientAngle,
  watchButtonTextFillMode,
  watchButtonTextSolidColor,
  watchButtonTextGradientFrom,
  watchButtonTextGradientVia,
  watchButtonTextGradientTo,
  watchButtonTextGradientAngle
`

/**
 * Client-safe GROQ for Presentation live updates of the Originals index.
 * Mirrors ORIGINALS_PREVIEW_QUERY — keep in sync.
 */
export const ORIGINALS_PRESENTATION_QUERY = `
*[_type == "original"] | order(coalesce(publishedAt, _updatedAt) desc) {
  _id,
  title,
  "slug": slug.current,
  description,
  format,
  tags,
  publishedAt,
  "contentKind": coalesce(contentKind, "film"),
  "coverImageUrl": coverImage.asset->url,
  "logoUrl": logo.asset->url,
  "youtubeVideoId": select(
    coalesce(contentKind, "film") == "film" => coalesce(film.media.youtubeVideoId, youtubeVideoId),
    null
  ),
  ${originalBrandFillProjection}
}
`

/**
 * Client-safe GROQ for Presentation live updates of a single original.
 * Mirrors ORIGINAL_BY_SLUG_PREVIEW_QUERY — keep in sync.
 */
export const ORIGINAL_BY_SLUG_PRESENTATION_QUERY = `
*[_type == "original" && lower(slug.current) == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  description,
  format,
  tags,
  publishedAt,
  "contentKind": coalesce(contentKind, "film"),
  "coverImageUrl": coverImage.asset->url,
  "logoUrl": logo.asset->url,
  "legacyYoutubeVideoId": youtubeVideoId,
  ${originalBrandFillProjection},
  film {
    media { ${originalMediaProj} },
    trailer { ${originalMediaProj} }
  },
  podcastSeries {
    youtubePlaylistId,
    lastSyncedAt,
    episodes[]->{
      _id,
      title,
      "slug": slug.current,
      episodeNumber,
      description,
      publishedAt,
      "thumbnailUrl": thumbnail.asset->url,
      media { ${originalMediaProj} },
      youtubeVideoId
    }
  },
  articleSeries {
    chapters[] {
      _key,
      title,
      body[] {
        ...,
        _type == "image" => {
          ...,
          "asset": {
            "_id": asset->_id,
            "url": asset->url
          }
        }
      }
    }
  }
}
`

export type OriginalPresentationIndexRow = {
  _id: string
  title?: string | null
  slug?: string | null
  description?: string | null
  format?: string | null
  tags?: string[] | null
  publishedAt?: string | null
  contentKind?: string | null
  coverImageUrl?: string | null
  logoUrl?: string | null
  youtubeVideoId?: string | null
  [key: string]: unknown
}

export function mapPresentationOriginalPreviews(
  rows: OriginalPresentationIndexRow[] | null | undefined,
): OriginalPreview[] {
  if (!rows?.length) return []
  return rows
    .map((row) => {
      try {
        const cleaned = stegaClean(row) as OriginalPresentationIndexRow
        if (!cleaned._id || !cleaned.title || !cleaned.slug) return null
        return mapSanityOriginalToPreview({
          ...cleaned,
          _id: cleaned._id,
          title: cleaned.title,
          slug: cleaned.slug,
        } as Parameters<typeof mapSanityOriginalToPreview>[0])
      } catch {
        return null
      }
    })
    .filter((item): item is OriginalPreview => Boolean(item))
}

export function mapPresentationOriginalDetail(
  row: Record<string, unknown> | null | undefined,
): OriginalDetail | null {
  if (row == null) return null
  try {
    const cleaned = stegaClean(row) as Parameters<typeof mapSanityOriginalToDetail>[0]
    if (!cleaned._id || !cleaned.title || !cleaned.slug) return null
    return mapSanityOriginalToDetail(cleaned)
  } catch {
    return null
  }
}
