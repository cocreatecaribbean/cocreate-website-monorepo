import type {
  BrandTextFill,
  ImpactCalloutFill,
  OriginalArticleChapter,
  OriginalContentKind,
  OriginalDetail,
  OriginalEpisode,
  OriginalPreview,
  OriginalVideoMedia,
  ProjectMedia,
  ProjectMediaType,
  ProjectPreview,
  WorkProjectCategory,
  WorkProjectDetail,
  WorkProjectSection,
} from '@cocreate/types'
import { stegaClean } from '@sanity/client/stega'
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
  titleFillMode?: string | null
  titleSolidColor?: string | null
  titleGradientFrom?: string | null
  titleGradientVia?: string | null
  titleGradientTo?: string | null
  titleGradientAngle?: number | null
  clientFillMode?: string | null
  clientSolidColor?: string | null
  clientGradientFrom?: string | null
  clientGradientVia?: string | null
  clientGradientTo?: string | null
  clientGradientAngle?: number | null
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
  fillMode?: string | null
  solidColor?: string | null
  gradientFrom?: string | null
  gradientVia?: string | null
  gradientTo?: string | null
  gradientAngle?: number | null
  subFillMode?: string | null
  subSolidColor?: string | null
  subGradientFrom?: string | null
  subGradientVia?: string | null
  subGradientTo?: string | null
  subGradientAngle?: number | null
  media?: SanityMediaRow
  mediaPosition?: string | null
  heading?: string | null
}

const HEX_EXTRACT = /#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/
/** Zero-width / format chars Presentation may inject; strip before hex parse. */
const INVISIBLE_CHARS = /[\u200B-\u200D\uFEFF\u2060]/g

function cleanFillString(value: string | null | undefined): string {
  if (value == null) return ''
  return stegaClean(String(value)).replace(INVISIBLE_CHARS, '').trim()
}

/** Normalize a hex color; strips stega / invisible chars and extracts the first valid hex. */
export function normalizeHexColor(value: string | null | undefined): string | undefined {
  const cleaned = cleanFillString(value)
  if (!cleaned) return undefined
  const match = cleaned.match(HEX_EXTRACT)
  if (!match?.[1]) return undefined
  const hex = match[1]
  if (hex.length === 3) {
    const [r, g, b] = hex
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return `#${hex}`.toLowerCase()
}

type BrandFillSource = {
  fillMode?: string | null
  solidColor?: string | null
  gradientFrom?: string | null
  gradientVia?: string | null
  gradientTo?: string | null
  gradientAngle?: number | null
}

/** Map Sanity brand fill fields into a resolved fill (or undefined for default gradient). */
export function mapBrandFill(row: BrandFillSource): BrandTextFill | undefined {
  const mode = cleanFillString(row.fillMode)
  if (mode === 'solid') {
    const color = normalizeHexColor(row.solidColor)
    return color ? {mode: 'solid', color} : undefined
  }
  if (mode === 'gradient') {
    const from = normalizeHexColor(row.gradientFrom)
    const to = normalizeHexColor(row.gradientTo)
    if (!from || !to) return undefined
    const via = normalizeHexColor(row.gradientVia)
    const angle =
      typeof row.gradientAngle === 'number' &&
      Number.isFinite(row.gradientAngle) &&
      row.gradientAngle >= 0 &&
      row.gradientAngle <= 360
        ? row.gradientAngle
        : 90
    return via
      ? {mode: 'gradient', from, via, to, angle}
      : {mode: 'gradient', from, to, angle}
  }
  return undefined
}

/** @deprecated Prefer mapBrandFill */
export function mapImpactCalloutFill(row: BrandFillSource): ImpactCalloutFill | undefined {
  return mapBrandFill(row)
}

type SanityOriginalMediaRow = {
  mediaSource?: string | null
  youtubeVideoId?: string | null
  playbackId?: string | null
  posterUrl?: string | null
} | null

type SanityOriginalRow = {
  _id: string
  title: string
  slug: string
  description?: string | null
  format?: string | null
  contentKind?: string | null
  coverImageUrl?: string | null
  youtubeVideoId?: string | null
  tags?: string[] | null
  publishedAt?: string | null
  legacyYoutubeVideoId?: string | null
  film?: {
    media?: SanityOriginalMediaRow
    trailer?: SanityOriginalMediaRow
  } | null
  podcastSeries?: {
    episodes?: Array<{
      _id: string
      title?: string | null
      slug?: string | null
      episodeNumber?: number | null
      description?: string | null
      publishedAt?: string | null
      thumbnailUrl?: string | null
      media?: SanityOriginalMediaRow
      youtubeVideoId?: string | null
    } | null> | null
  } | null
  articleSeries?: {
    chapters?: Array<{
      _key?: string | null
      title?: string | null
      body?: unknown[] | null
    } | null> | null
  } | null
}

function normalizeOriginalContentKind(value: string | null | undefined): OriginalContentKind {
  if (value === 'podcastSeries' || value === 'articleSeries' || value === 'film') {
    return value
  }
  return 'film'
}

function mapOriginalVideoMedia(
  row: SanityOriginalMediaRow | undefined,
  legacyYoutubeId?: string | null,
): OriginalVideoMedia | null {
  const mediaSource = row?.mediaSource === 'muxVideo' ? 'muxVideo' : 'youtube'
  if (mediaSource === 'muxVideo') {
    const playbackId = row?.playbackId?.trim()
    if (!playbackId) return null
    return {
      mediaSource: 'muxVideo',
      playbackId,
      posterUrl: row?.posterUrl?.trim() || undefined,
    }
  }

  const youtubeVideoId =
    row?.youtubeVideoId?.trim() || legacyYoutubeId?.trim() || undefined
  if (!youtubeVideoId) return null
  return {
    mediaSource: 'youtube',
    youtubeVideoId,
  }
}

function mapOriginalEpisode(row: NonNullable<
  NonNullable<SanityOriginalRow['podcastSeries']>['episodes']
>[number]): OriginalEpisode | null {
  if (!row?._id || !row.title) return null
  const media =
    mapOriginalVideoMedia(row.media, row.youtubeVideoId) ??
    (row.youtubeVideoId
      ? {mediaSource: 'youtube' as const, youtubeVideoId: row.youtubeVideoId}
      : null)
  if (!media) return null
  return {
    id: row._id,
    title: row.title,
    slug: row.slug?.trim() || row._id,
    episodeNumber: typeof row.episodeNumber === 'number' ? row.episodeNumber : undefined,
    description: row.description?.trim() || undefined,
    publishedAt: row.publishedAt ?? undefined,
    thumbnailSrc: row.thumbnailUrl?.trim() || undefined,
    media,
  }
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
        const fill = mapBrandFill(row)
        const subFill = mapBrandFill({
          fillMode: row.subFillMode,
          solidColor: row.subSolidColor,
          gradientFrom: row.subGradientFrom,
          gradientVia: row.subGradientVia,
          gradientTo: row.subGradientTo,
          gradientAngle: row.subGradientAngle,
        })
        sections.push({
          _type: 'impactCallout',
          _key: key,
          headline,
          subheadline,
          ...(fill ? {fill} : {}),
          ...(subFill ? {subFill} : {}),
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

  const titleFill = mapBrandFill({
    fillMode: row.titleFillMode,
    solidColor: row.titleSolidColor,
    gradientFrom: row.titleGradientFrom,
    gradientVia: row.titleGradientVia,
    gradientTo: row.titleGradientTo,
    gradientAngle: row.titleGradientAngle,
  })
  const clientFill = mapBrandFill({
    fillMode: row.clientFillMode,
    solidColor: row.clientSolidColor,
    gradientFrom: row.clientGradientFrom,
    gradientVia: row.clientGradientVia,
    gradientTo: row.clientGradientTo,
    gradientAngle: row.clientGradientAngle,
  })

  return {
    ...preview,
    slug: preview.slug ?? preview.id,
    category: preview.category,
    summary: preview.summary ?? '',
    hero: mapSanityProjectMedia(row.hero),
    ...(titleFill ? {titleFill} : {}),
    ...(clientFill ? {clientFill} : {}),
    sections: mapSections(row.sections),
    seo: row.seo ?? undefined,
  }
}

export function mapSanityOriginalToPreview(row: SanityOriginalRow): OriginalPreview {
  const contentKind = normalizeOriginalContentKind(row.contentKind)
  const slug = row.slug
  return {
    id: row._id,
    title: row.title,
    slug,
    description: row.description ?? undefined,
    format: row.format ?? undefined,
    contentKind,
    coverImageSrc: row.coverImageUrl ?? '',
    youtubeVideoId: row.youtubeVideoId ?? undefined,
    href: `/originals/${slug}`,
  }
}

export function mapSanityOriginalToDetail(row: SanityOriginalRow): OriginalDetail {
  const preview = mapSanityOriginalToPreview(row)
  const base = {
    ...preview,
    publishedAt: row.publishedAt ?? undefined,
    tags: row.tags?.filter(Boolean) ?? undefined,
  }

  if (preview.contentKind === 'podcastSeries') {
    const episodes = (row.podcastSeries?.episodes ?? [])
      .map(mapOriginalEpisode)
      .filter((ep): ep is OriginalEpisode => Boolean(ep))
    return {...base, contentKind: 'podcastSeries', episodes}
  }

  if (preview.contentKind === 'articleSeries') {
    const chapters: OriginalArticleChapter[] = (row.articleSeries?.chapters ?? [])
      .filter((ch): ch is NonNullable<typeof ch> => Boolean(ch?.title && ch.body?.length))
      .map((ch, index) => ({
        _key: ch._key?.trim() || `chapter-${index}`,
        title: ch.title as string,
        body: ch.body as unknown[],
      }))
    return {...base, contentKind: 'articleSeries', chapters}
  }

  const media =
    mapOriginalVideoMedia(row.film?.media, row.legacyYoutubeVideoId ?? row.youtubeVideoId) ??
    (row.legacyYoutubeVideoId || row.youtubeVideoId
      ? {
          mediaSource: 'youtube' as const,
          youtubeVideoId: (row.legacyYoutubeVideoId || row.youtubeVideoId) as string,
        }
      : null)

  if (!media) {
    // Published film without media — still render detail shell with cover only
    return {
      ...base,
      contentKind: 'film',
      media: {mediaSource: 'youtube'},
      trailer: null,
    }
  }

  return {
    ...base,
    contentKind: 'film',
    media,
    trailer: mapOriginalVideoMedia(row.film?.trailer),
  }
}
