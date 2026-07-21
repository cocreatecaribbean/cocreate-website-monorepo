import type {
  ProjectMedia,
  ProjectMediaType,
  ProjectPreview,
  OriginalPreview,
  WorkProjectCategory,
  WorkProjectDetail,
  WorkProjectSection,
} from '@cocreate/types'
import type { SanityImageSource } from '@sanity/image-url'
import { workProjectPath } from '@/lib/work-project-path'
import {
  urlForHomeGalleryCover,
  urlForImage,
  urlForWorkCover,
} from '@/sanity/lib/image'

type SanityImageRow = {
  crop?: unknown
  hotspot?: unknown
  asset?: unknown
  assetUrl?: string | null
  lqip?: string | null
} | null

type SanityMediaRow = {
  mediaType?: string | null
  alt?: string | null
  image?: SanityImageRow
  cover?: SanityImageRow
  loopPoster?: SanityImageRow
  playbackId?: string | null
  loopVideoSrc?: string | null
  loopVideoMime?: string | null
  /** @deprecated resolved in mapper from cover / loopPoster / playbackId */
  posterUrl?: string | null
} | null

function resolvePosterUrl(
  row: SanityMediaRow | undefined,
): string | undefined {
  if (!row) return undefined
  const fromCover = resolveImageSrc(row.cover ?? undefined)
  if (fromCover) return fromCover
  const fromLoopPoster = resolveImageSrc(row.loopPoster ?? undefined)
  if (fromLoopPoster) return fromLoopPoster
  const playbackId = row.playbackId?.trim()
  if (playbackId) {
    return `https://image.mux.com/${playbackId}/thumbnail.jpg`
  }
  return row.posterUrl?.trim() || undefined
}

function resolveLqip(image: SanityImageRow | undefined): string | undefined {
  const lqip = image?.lqip?.trim()
  return lqip || undefined
}

/** Prefer image LQIP; for video posters use cover then loopPoster. */
function resolveMediaBlurDataURL(
  row: SanityMediaRow | undefined,
  mediaType: ProjectMediaType,
): string | undefined {
  if (!row) return undefined
  if (mediaType === 'image') return resolveLqip(row.image)
  return resolveLqip(row.cover) ?? resolveLqip(row.loopPoster)
}

function normalizeMediaType(
  raw: string | null | undefined,
): ProjectMediaType | null {
  if (!raw) return null
  // Legacy schema value "video" → muxVideo
  if (raw === 'video' || raw === 'muxVideo') return 'muxVideo'
  if (raw === 'image' || raw === 'loopVideo') return raw
  return null
}

type SanityWorkProjectRow = {
  _id: string
  title: string
  slug: string
  summary?: string | null
  /** @deprecated prefer coverImage — kept for tests / legacy rows */
  coverImageUrl?: string | null
  coverImage?: SanityImageRow
  clientName?: string | null
  clientSlug?: string | null
  category?: WorkProjectCategory | null
  featured?: boolean | null
  tags?: string[] | null
  overviewCategories?: string[] | null
  overviewIndustries?: string[] | null
  hero?: SanityMediaRow
  sections?: SanitySectionRow[] | null
  seo?: { metaTitle?: string; metaDescription?: string } | null
}

type SanitySectionRow = {
  _key?: string | null
  _type?: string | null
  categories?: string[] | null
  industries?: string[] | null
  body?: string | null
  left?: SanityMediaRow
  right?: SanityMediaRow
  headline?: string | null
  subheadline?: string | null
  media?: SanityMediaRow
  mediaPosition?: string | null
  heading?: string | null
}

type SanityOriginalRow = {
  _id: string
  title: string
  slug: string
  description?: string | null
  format?: string | null
  coverImageUrl?: string | null
  youtubeVideoId?: string | null
}

function resolveImageSrc(image: SanityImageRow | undefined): string | undefined {
  if (!image) return undefined
  if (image.asset) {
    const built = urlForImage(image as SanityImageSource)
      ?.width(1600)
      .fit('max')
      .auto('format')
      .url()
    if (built) return built
  }
  const fallback = image.assetUrl?.trim()
  return fallback || undefined
}

export function mapSanityProjectMedia(
  row: SanityMediaRow | undefined,
): ProjectMedia | null {
  const mediaType = normalizeMediaType(row?.mediaType)
  if (!mediaType || !row) return null
  const alt = row.alt?.trim() || undefined
  const posterUrl = resolvePosterUrl(row)
  const blurDataURL = resolveMediaBlurDataURL(row, mediaType)

  if (mediaType === 'muxVideo') {
    const playbackId = row.playbackId?.trim()
    if (!playbackId) return null
    return {
      mediaType: 'muxVideo',
      alt,
      playbackId,
      posterUrl,
      blurDataURL,
    }
  }

  if (mediaType === 'loopVideo') {
    const loopVideoSrc = row.loopVideoSrc?.trim()
    if (!loopVideoSrc) return null
    return {
      mediaType: 'loopVideo',
      alt,
      loopVideoSrc,
      posterUrl,
      blurDataURL,
    }
  }

  const imageSrc = resolveImageSrc(row.image)
  if (!imageSrc) return null
  return {
    mediaType: 'image',
    alt,
    imageSrc,
    blurDataURL,
  }
}

function mapSections(
  rows: SanitySectionRow[] | null | undefined,
): WorkProjectSection[] {
  if (!rows?.length) return []

  const sections: WorkProjectSection[] = []

  for (const row of rows) {
    const key = row._key?.trim()
    const type = row._type?.trim()
    if (!key || !type) continue

    switch (type) {
      case 'projectOverview': {
        const body = row.body?.trim()
        if (!body) break
        sections.push({
          _type: 'projectOverview',
          _key: key,
          categories: row.categories?.filter(Boolean) ?? undefined,
          industries: row.industries?.filter(Boolean) ?? undefined,
          body,
        })
        break
      }
      case 'mediaPair': {
        const left = mapSanityProjectMedia(row.left)
        const right = mapSanityProjectMedia(row.right)
        if (!left || !right) break
        sections.push({
          _type: 'mediaPair',
          _key: key,
          left,
          right,
        })
        break
      }
      case 'impactCallout': {
        const headline = row.headline?.trim()
        const subheadline = row.subheadline?.trim()
        if (!headline || !subheadline) break
        sections.push({
          _type: 'impactCallout',
          _key: key,
          headline,
          subheadline,
        })
        break
      }
      case 'textAndMedia': {
        const body = row.body?.trim()
        const media = mapSanityProjectMedia(row.media)
        const mediaPosition =
          row.mediaPosition === 'left' || row.mediaPosition === 'right'
            ? row.mediaPosition
            : 'right'
        if (!body || !media) break
        sections.push({
          _type: 'textAndMedia',
          _key: key,
          body,
          media,
          mediaPosition,
        })
        break
      }
      case 'mediaBanner': {
        const media = mapSanityProjectMedia(row.media)
        if (!media) break
        sections.push({
          _type: 'mediaBanner',
          _key: key,
          media,
        })
        break
      }
      case 'shareBar': {
        sections.push({
          _type: 'shareBar',
          _key: key,
          heading: row.heading?.trim() || 'Share on',
        })
        break
      }
      default:
        break
    }
  }

  return sections
}

type CoverCrop = 'work' | 'homeGallery'

function resolveWorkCoverSrc(
  coverImage: SanityImageRow | undefined,
  fallbackUrl?: string | null,
  crop: CoverCrop = 'work',
): string {
  if (coverImage?.asset) {
    const built =
      crop === 'homeGallery'
        ? urlForHomeGalleryCover(coverImage as SanityImageSource)
        : urlForWorkCover(coverImage as SanityImageSource)
    if (built) return built
  }
  const fromAsset = coverImage?.assetUrl?.trim()
  if (fromAsset) return fromAsset
  return fallbackUrl?.trim() ?? ''
}

function cleanStringList(values: string[] | null | undefined): string[] | undefined {
  const cleaned = values?.map((v) => v.trim()).filter(Boolean) ?? []
  return cleaned.length ? cleaned : undefined
}

/** Prefer projected index fields; fall back to first projectOverview section. */
function resolveOverviewChips(row: SanityWorkProjectRow): {
  overviewCategories?: string[]
  overviewIndustries?: string[]
} {
  const fromProjectedCategories = cleanStringList(row.overviewCategories)
  const fromProjectedIndustries = cleanStringList(row.overviewIndustries)
  if (fromProjectedCategories || fromProjectedIndustries) {
    return {
      overviewCategories: fromProjectedCategories,
      overviewIndustries: fromProjectedIndustries,
    }
  }

  const overview = row.sections?.find((section) => section._type === 'projectOverview')
  return {
    overviewCategories: cleanStringList(overview?.categories),
    overviewIndustries: cleanStringList(overview?.industries),
  }
}

export function mapSanityWorkProjectToPreview(
  row: SanityWorkProjectRow,
  options?: { coverCrop?: CoverCrop },
): ProjectPreview {
  const slug = row.slug
  const coverImageSrc = resolveWorkCoverSrc(
    row.coverImage,
    row.coverImageUrl,
    options?.coverCrop ?? 'work',
  )
  const coverImageBlurDataURL = resolveLqip(row.coverImage)
  const { overviewCategories, overviewIndustries } = resolveOverviewChips(row)

  return {
    id: row._id,
    slug,
    projectName: row.title,
    clientName: row.clientName ?? '',
    clientSlug: row.clientSlug ?? undefined,
    category: row.category ?? undefined,
    summary: row.summary ?? undefined,
    coverImageSrc,
    coverImageBlurDataURL,
    href: workProjectPath(slug),
    featured: row.featured ?? false,
    tags: cleanStringList(row.tags),
    overviewCategories,
    overviewIndustries,
  }
}

/** Home arc gallery — landscape CDN crop so letterboxed covers fill the card. */
export function mapSanityWorkProjectToHomePreview(
  row: SanityWorkProjectRow,
): ProjectPreview {
  return mapSanityWorkProjectToPreview(row, { coverCrop: 'homeGallery' })
}

export function mapSanityWorkProjectToDetail(row: SanityWorkProjectRow): WorkProjectDetail {
  const preview = mapSanityWorkProjectToPreview(row)

  if (!preview.category) {
    throw new Error(`Sanity project "${preview.id}" is missing category`)
  }

  return {
    ...preview,
    slug: preview.slug ?? preview.id,
    category: preview.category,
    summary: preview.summary ?? '',
    hero: mapSanityProjectMedia(row.hero),
    sections: mapSections(row.sections),
    seo: row.seo ?? undefined,
  }
}

export function mapSanityOriginalToPreview(row: SanityOriginalRow): OriginalPreview {
  return {
    id: row._id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? undefined,
    format: row.format ?? undefined,
    coverImageSrc: row.coverImageUrl ?? '',
    youtubeVideoId: row.youtubeVideoId ?? undefined,
    href: '/originals',
  }
}
