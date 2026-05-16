/**
 * Lightweight project card used in galleries, carousels, and work grids.
 * Map from CMS / API payloads before passing into UI components.
 */
export type ProjectPreview = {
  id: string
  projectName: string
  clientName: string
  /** Public URL or site-relative path for the cover image */
  coverImageSrc: string
  href?: string
}
