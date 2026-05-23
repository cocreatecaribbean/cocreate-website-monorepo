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
}

export type WorkProjectDetail = ProjectPreview & {
  slug: string
  category: WorkProjectCategory
  summary: string
}

export type OriginalPreview = {
  id: string
  title: string
  slug: string
  description?: string
  format?: string
  coverImageSrc: string
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
