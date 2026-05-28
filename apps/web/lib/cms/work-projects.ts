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
import { HOME_GALLERY_PREVIEW_COUNT } from '@/site-info/home-gallery-config'

export const fetchWorkProjectPreviews = cache(async (): Promise<ProjectPreview[]> => {
  const client = getSanityClient()
  if (!client) {
    return []
  }

  try {
    const rows = await client.fetch(WORK_PROJECTS_QUERY)
    if (!rows?.length) {
      return []
    }
    return enrichProjectPreviews(rows.map(mapSanityWorkProjectToPreview))
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[fetchWorkProjectPreviews] Sanity fetch failed:', error)
    }
    return []
  }
})

export const fetchWorkProjectBySlug = cache(
  async (slug: string): Promise<WorkProjectDetail | null> => {
    const key = slug.trim().toLowerCase()

    const client = getSanityClient()
    if (!client) {
      return null
    }

    try {
      const row = await client.fetch(WORK_PROJECT_BY_SLUG_QUERY, { slug: key })
      if (!row) {
        return null
      }
      return mapSanityWorkProjectToDetail(row)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[fetchWorkProjectBySlug] Sanity fetch failed:', error)
      }
      return null
    }
  },
)

export const fetchWorkProjectSlugs = cache(async (): Promise<string[]> => {
  const client = getSanityClient()
  if (!client) {
    return []
  }

  try {
    const rows = await client.fetch(WORK_PROJECT_SLUGS_QUERY)
    if (!rows?.length) {
      return []
    }
    return rows.map((row: { slug: string }) => row.slug).filter(Boolean)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[fetchWorkProjectSlugs] Sanity fetch failed:', error)
    }
    return []
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
  return projects.slice(0, HOME_GALLERY_PREVIEW_COUNT)
})
