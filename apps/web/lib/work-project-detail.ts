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
    hero: enriched.coverImageSrc?.trim()
      ? {
          mediaType: 'image',
          imageSrc: enriched.coverImageSrc.trim(),
          alt: enriched.projectName,
        }
      : null,
    sections: [
      {
        _type: 'projectOverview',
        _key: 'mock-overview',
        categories: [enriched.category],
        body: enriched.summary,
      },
      {
        _type: 'shareBar',
        _key: 'mock-share',
        heading: 'Share on',
      },
    ],
  }
}
