import type { ProjectPreview } from '@cocreate/types'
import { HOME_GALLERY_PREVIEW_COUNT } from '@/site-info/home-gallery-config'

/**
 * Home “Projects at a Glance” selection:
 * featured first (Studio array order preserved), then non-featured fill,
 * up to `limit`. Prefer items with cover images when any exist.
 */
export function selectHomeGalleryPreviews(
  projects: ProjectPreview[],
  limit: number = HOME_GALLERY_PREVIEW_COUNT,
): ProjectPreview[] {
  if (!projects.length || limit <= 0) return []

  const withCovers = projects.filter((project) =>
    Boolean(project.coverImageSrc?.trim()),
  )
  const source = withCovers.length > 0 ? withCovers : projects

  const featured: ProjectPreview[] = []
  const rest: ProjectPreview[] = []
  for (const project of source) {
    if (project.featured) featured.push(project)
    else rest.push(project)
  }

  return [...featured, ...rest].slice(0, limit)
}
