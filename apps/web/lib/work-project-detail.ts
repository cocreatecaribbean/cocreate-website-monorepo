import type { ProjectPreview, WorkProjectDetail } from '@cocreate/types'
import { enrichProjectPreview } from '@/lib/project-preview'

export function toWorkProjectDetail(project: ProjectPreview): WorkProjectDetail {
  const enriched = enrichProjectPreview(project)
  if (!enriched.category || !enriched.summary) {
    throw new Error(`Project "${enriched.id}" is missing category or summary`)
  }

  return {
    ...enriched,
    slug: enriched.slug ?? enriched.id,
    category: enriched.category,
    summary: enriched.summary,
  }
}
