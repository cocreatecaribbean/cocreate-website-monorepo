/**
 * Work project service categories (aligned with Sanity `workProject.category`).
 */
export const WORK_PROJECT_CATEGORIES = [
  'Production',
  'Digital',
  'PR & Communications',
  'Brands & Strategy',
  'Talent',
  'Analytics',
] as const

export type WorkProjectCategory = (typeof WORK_PROJECT_CATEGORIES)[number]

export type ProjectMediaType = 'image' | 'muxVideo' | 'loopVideo'

/** Resolved media for project detail sections / hero. */
export type ProjectMedia = {
  mediaType: ProjectMediaType
  alt?: string
  /** CDN URL when mediaType is image */
  imageSrc?: string
  /** Mux playback id when mediaType is muxVideo */
  playbackId?: string
  /** CDN URL for ambient HTML loop video */
  loopVideoSrc?: string
  /** Mux thumbnail, loop poster, or custom poster */
  posterUrl?: string
  /** Sanity LQIP (or equivalent) for next/image blur placeholder */
  blurDataURL?: string
}

export type ProjectOverviewSection = {
  _type: 'projectOverview'
  _key: string
  categories?: string[]
  industries?: string[]
  body: string
}

export type MediaPairSection = {
  _type: 'mediaPair'
  _key: string
  left: ProjectMedia
  right: ProjectMedia
}

export type BrandTextFill =
  | {mode: 'solid'; color: string}
  | {mode: 'gradient'; from: string; via?: string; to: string; angle: number}

/** @deprecated Prefer BrandTextFill — same shape. */
export type ImpactCalloutFill = BrandTextFill

export type ImpactCalloutSection = {
  _type: 'impactCallout'
  _key: string
  headline: string
  subheadline: string
  /** When omitted, UI uses the default CoCreate gradient. */
  fill?: BrandTextFill
  /** When omitted, UI uses muted San Marino. */
  subFill?: BrandTextFill
}

export type TextAndMediaSection = {
  _type: 'textAndMedia'
  _key: string
  body: string
  media: ProjectMedia
  mediaPosition: 'left' | 'right'
}

export type MediaBannerSection = {
  _type: 'mediaBanner'
  _key: string
  media: ProjectMedia
}

export type ShareBarSection = {
  _type: 'shareBar'
  _key: string
  heading?: string
}

export type WorkProjectSection =
  | ProjectOverviewSection
  | MediaPairSection
  | ImpactCalloutSection
  | TextAndMediaSection
  | MediaBannerSection
  | ShareBarSection

/**
 * Lightweight project card used in galleries, carousels, and work grids.
 * Map from CMS / API payloads before passing into UI components.
 */
export type ProjectPreview = {
  id: string
  /** URL slug — defaults to `id` when omitted */
  slug?: string
  projectName: string
  clientName: string
  category?: WorkProjectCategory
  /** URL-safe client key for filters and search */
  clientSlug?: string
  /** Short line for cards, search, and project pages */
  summary?: string
  /** Public URL or site-relative path for the cover image */
  coverImageSrc: string
  /** Sanity LQIP for next/image blur placeholder on covers */
  coverImageBlurDataURL?: string
  href?: string
  featured?: boolean
  /** Sanity tags for search and project detail chips */
  tags?: string[]
  /** Overview section CATEGORY pills (searchable like tags) */
  overviewCategories?: string[]
  /** Overview section INDUSTRY pills (searchable like tags) */
  overviewIndustries?: string[]
}

export type WorkProjectDetail = ProjectPreview & {
  slug: string
  category: WorkProjectCategory
  summary: string
  /** Detail heading hero (image or Mux video) */
  hero?: ProjectMedia | null
  /** Optional brand fill for the project name H1. Default = CoCreate gradient. */
  titleFill?: BrandTextFill
  /** Optional brand fill for the client name under the H1. Default = muted San Marino. */
  clientFill?: BrandTextFill
  /** Modular page-builder sections */
  sections: WorkProjectSection[]
  seo?: {
    metaTitle?: string
    metaDescription?: string
  }
}

export type OriginalContentKind = 'podcastSeries' | 'film' | 'articleSeries'

export type OriginalMediaSource = 'youtube' | 'muxVideo'

/** Resolved YouTube or Mux video for originals / episodes. */
export type OriginalVideoMedia = {
  mediaSource: OriginalMediaSource
  youtubeVideoId?: string
  playbackId?: string
  posterUrl?: string
}

export type OriginalPreview = {
  id: string
  title: string
  slug: string
  description?: string
  format?: string
  contentKind: OriginalContentKind
  coverImageSrc: string
  /** Film YouTube id when present (list/search convenience) */
  youtubeVideoId?: string
  href?: string
}

export type OriginalEpisode = {
  id: string
  title: string
  slug: string
  episodeNumber?: number
  description?: string
  publishedAt?: string
  thumbnailSrc?: string
  media: OriginalVideoMedia
}

export type OriginalArticleChapter = {
  _key: string
  title: string
  /** Portable Text blocks from Sanity `blockContent` */
  body: unknown[]
}

export type OriginalDetailBase = OriginalPreview & {
  publishedAt?: string
  tags?: string[]
}

export type OriginalPodcastDetail = OriginalDetailBase & {
  contentKind: 'podcastSeries'
  episodes: OriginalEpisode[]
}

export type OriginalFilmDetail = OriginalDetailBase & {
  contentKind: 'film'
  media: OriginalVideoMedia
  trailer?: OriginalVideoMedia | null
}

export type OriginalArticleDetail = OriginalDetailBase & {
  contentKind: 'articleSeries'
  chapters: OriginalArticleChapter[]
}

export type OriginalDetail =
  | OriginalPodcastDetail
  | OriginalFilmDetail
  | OriginalArticleDetail

export type SearchResultKind = 'client' | 'project' | 'original' | 'category' | 'tag'

export type SearchResult = {
  id: string
  kind: SearchResultKind
  title: string
  subtitle?: string
  href: string
  /** Project count when kind is client or category */
  projectCount?: number
}
