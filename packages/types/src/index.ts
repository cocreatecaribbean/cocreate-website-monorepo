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

export const PROJECT_VIDEO_ROLES = [
  'final_ad',
  'making_of',
  'hero_reel',
  'other',
] as const

export type ProjectVideoRole = (typeof PROJECT_VIDEO_ROLES)[number]

export type ProjectVideo = {
  role: ProjectVideoRole
  title?: string
  playbackId: string
  status?: string
  duration?: number
  aspectRatio?: string
  posterUrl?: string
}

export type GalleryImage = {
  src: string
  alt?: string
  caption?: string
}

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
  href?: string
  featured?: boolean
  /** Hero reel playback ID when present on this project */
  heroReelPlaybackId?: string
}

export type WorkProjectDetail = ProjectPreview & {
  slug: string
  category: WorkProjectCategory
  summary: string
  /** Portable Text blocks from Sanity */
  caseStudy?: unknown[]
  gallery?: GalleryImage[]
  videos?: ProjectVideo[]
  seo?: {
    metaTitle?: string
    metaDescription?: string
  }
}

export type OriginalPreview = {
  id: string
  title: string
  slug: string
  description?: string
  format?: string
  coverImageSrc: string
  youtubeVideoId?: string
  href?: string
}

export type SearchResultKind = 'client' | 'project' | 'original' | 'category'

export type SearchResult = {
  id: string
  kind: SearchResultKind
  title: string
  subtitle?: string
  href: string
  /** Project count when kind is client or category */
  projectCount?: number
}
