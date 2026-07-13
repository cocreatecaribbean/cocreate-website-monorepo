import 'server-only'

import { cache } from 'react'
import type { ProjectPreview, WorkProjectDetail } from '@cocreate/types'
import { sanityFetch } from '@/lib/server/sanity'
import { getSanityClient } from '@/sanity/lib/client'
import {
  WORK_PROJECT_BY_SLUG_PREVIEW_QUERY,
  WORK_PROJECT_BY_SLUG_QUERY,
  WORK_PROJECTS_INDEX_PREVIEW_QUERY,
  WORK_PROJECTS_INDEX_QUERY,
} from '@/sanity/lib/queries'
import {
  mapSanityWorkProjectToDetail,
  mapSanityWorkProjectToPreview,
} from '@/sanity/lib/mappers'
import { enrichProjectPreviews } from '@/lib/project-preview'
import { toWorkProjectDetail } from '@/lib/work-project-detail'
import { HOME_GALLERY_PREVIEW_COUNT } from '@/site-info/home-gallery-config'
import { galleryProjectPreviews } from '@/site-info/gallery-data'
import { isSanityConfigured } from '@/sanity/env'

function mockWorkPreviews(): ProjectPreview[] {
  return galleryProjectPreviews
}

function mockWorkBySlug(slug: string): WorkProjectDetail | null {
  const key = slug.trim().toLowerCase()
  const fallback = mockWorkPreviews().find(
    (project) => (project.slug ?? project.id).toLowerCase() === key,
  )
  if (!fallback) return null
  return toWorkProjectDetail(fallback)
}

async function fetchSanityWorkPreviews(preview: boolean): Promise<ProjectPreview[] | null> {
  if (!isSanityConfigured()) {
    return null
  }

  try {
    const query = preview ? WORK_PROJECTS_INDEX_PREVIEW_QUERY : WORK_PROJECTS_INDEX_QUERY
    const rows = preview
      ? await sanityFetch<Record<string, unknown>[]>(query, { preview: true })
      : await getSanityClient()?.fetch(query)

    if (!rows?.length) {
      return null
    }

    const visibleRows = preview
      ? rows
      : rows.filter((row: Record<string, unknown>) => {
          const publishedAt = row.publishedAt
          if (typeof publishedAt !== 'string' || !publishedAt.trim()) return false
          return new Date(publishedAt).getTime() <= Date.now()
        })

    if (!visibleRows.length) {
      return null
    }

    return enrichProjectPreviews(
      visibleRows.map((row: Record<string, unknown>) =>
        mapSanityWorkProjectToPreview(row as Parameters<typeof mapSanityWorkProjectToPreview>[0]),
      ),
    )
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[fetchWorkProjectPreviews] Sanity fetch failed:', error)
    }
    return null
  }
}

export const fetchWorkProjectPreviews = cache(
  async (preview = false): Promise<ProjectPreview[]> => {
    const fromSanity = await fetchSanityWorkPreviews(preview)
    if (fromSanity) return fromSanity
    // Sanity configured but empty (or preview) → never flash gallery mocks
    if (isSanityConfigured() || preview) return []
    return mockWorkPreviews()
  },
)

export const fetchWorkProjectBySlug = cache(
  async (slug: string, preview = false): Promise<WorkProjectDetail | null> => {
    const key = slug.trim().toLowerCase()

    if (isSanityConfigured()) {
      try {
        const query = preview ? WORK_PROJECT_BY_SLUG_PREVIEW_QUERY : WORK_PROJECT_BY_SLUG_QUERY
        const row = preview
          ? await sanityFetch<Record<string, unknown> | null>(query, {
              preview: true,
              params: {slug: key},
            })
          : await getSanityClient()?.fetch(query, {slug: key})

        if (row) {
          if (!preview) {
            const publishedAt = row.publishedAt
            if (typeof publishedAt !== 'string' || !publishedAt.trim()) return null
            if (new Date(publishedAt).getTime() > Date.now()) return null
          }
          return mapSanityWorkProjectToDetail(
            row as Parameters<typeof mapSanityWorkProjectToDetail>[0],
          )
        }

        // Sanity is configured → never mix in mocks for a missing slug
        return null
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[fetchWorkProjectBySlug] Sanity fetch failed:', error)
        }
        return null
      }
    }

    // Presentation/draft: no mock project detail pages
    if (preview) return null
    return mockWorkBySlug(key)
  },
)

export const fetchWorkProjectSlugs = cache(async (): Promise<string[]> => {
  const projects = await fetchWorkProjectPreviews()
  return projects.map((project) => project.slug ?? project.id).filter(Boolean)
})

export const fetchHomeGalleryPreviews = cache(
  async (preview = false): Promise<ProjectPreview[]> => {
    const projects = await fetchWorkProjectPreviews(preview)
    // Presentation/home: skip drafts with no cover so we never paint empty Image src
    const withCovers = projects.filter((project) => Boolean(project.coverImageSrc?.trim()))
    const source = preview ? withCovers : withCovers.length > 0 ? withCovers : projects
    return source.slice(0, HOME_GALLERY_PREVIEW_COUNT)
  },
)
