import 'server-only'

import { cache } from 'react'
import type { ProjectPreview, WorkProjectDetail } from '@cocreate/types'
import { getSanityClient } from '@/sanity/lib/client'
import {
  FEATURED_HERO_REEL_QUERY,
  WORK_PROJECT_BY_SLUG_QUERY,
  WORK_PROJECT_SLUGS_QUERY,
  WORK_PROJECTS_QUERY,
} from '@/sanity/lib/queries'
import {
  mapSanityWorkProjectToDetail,
  mapSanityWorkProjectToPreview,
} from '@/sanity/lib/mappers'
import { enrichProjectPreviews } from '@/lib/project-preview'
import { galleryProjectPreviews } from '@/site-info/gallery-data'

export const fetchWorkProjectPreviews = cache(async (): Promise<ProjectPreview[]> => {
  const client = getSanityClient()
  if (!client) {
    return galleryProjectPreviews
  }

  try {
    const rows = await client.fetch(WORK_PROJECTS_QUERY)
    if (!rows?.length) {
      return galleryProjectPreviews
    }
    return enrichProjectPreviews(rows.map(mapSanityWorkProjectToPreview))
  } catch {
    return galleryProjectPreviews
  }
})

export const fetchWorkProjectBySlug = cache(
  async (slug: string): Promise<WorkProjectDetail | null> => {
    const key = slug.trim().toLowerCase()

    const client = getSanityClient()
    if (!client) {
      const fallback = galleryProjectPreviews.find(
        (project) => (project.slug ?? project.id).toLowerCase() === key,
      )
      if (!fallback) return null
      const { toWorkProjectDetail } = await import('@/lib/work-project-detail')
      return toWorkProjectDetail(fallback)
    }

    try {
      const row = await client.fetch(WORK_PROJECT_BY_SLUG_QUERY, { slug: key })
      if (!row) {
        const fallback = galleryProjectPreviews.find(
          (project) => (project.slug ?? project.id).toLowerCase() === key,
        )
        if (!fallback) return null
        const { toWorkProjectDetail } = await import('@/lib/work-project-detail')
        return toWorkProjectDetail(fallback)
      }
      return mapSanityWorkProjectToDetail(row)
    } catch {
      const fallback = galleryProjectPreviews.find(
        (project) => (project.slug ?? project.id).toLowerCase() === key,
      )
      if (!fallback) return null
      const { toWorkProjectDetail } = await import('@/lib/work-project-detail')
      return toWorkProjectDetail(fallback)
    }
  },
)

export const fetchWorkProjectSlugs = cache(async (): Promise<string[]> => {
  const client = getSanityClient()
  if (!client) {
    return galleryProjectPreviews.map((project) => project.slug ?? project.id)
  }

  try {
    const rows = await client.fetch(WORK_PROJECT_SLUGS_QUERY)
    if (!rows?.length) {
      return galleryProjectPreviews.map((project) => project.slug ?? project.id)
    }
    return rows.map((row: { slug: string }) => row.slug).filter(Boolean)
  } catch {
    return galleryProjectPreviews.map((project) => project.slug ?? project.id)
  }
})

export const fetchFeaturedHeroReelPlaybackId = cache(async (): Promise<string | null> => {
  const client = getSanityClient()
  if (!client) return null

  try {
    const row = await client.fetch(FEATURED_HERO_REEL_QUERY)
    return row?.playbackId ?? null
  } catch {
    return null
  }
})

export const fetchHomeGalleryPreviews = cache(async (): Promise<ProjectPreview[]> => {
  const projects = await fetchWorkProjectPreviews()
  const { HOME_GALLERY_PREVIEW_COUNT } = await import('@/site-info/gallery-data')
  return projects.slice(0, HOME_GALLERY_PREVIEW_COUNT)
})
