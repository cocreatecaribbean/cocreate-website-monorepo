import 'server-only'

import { cache } from 'react'
import type { OriginalDetail, OriginalPreview } from '@cocreate/types'
import { getSanityClient } from '@/sanity/lib/client'
import {
  ORIGINAL_BY_SLUG_QUERY,
  ORIGINAL_SLUGS_QUERY,
  ORIGINALS_QUERY,
} from '@/sanity/lib/queries'
import {
  mapSanityOriginalToDetail,
  mapSanityOriginalToPreview,
} from '@/sanity/lib/mappers'

export const fetchOriginalPreviews = cache(async (): Promise<OriginalPreview[]> => {
  const client = getSanityClient()
  if (!client) {
    return []
  }

  try {
    const rows = await client.fetch(ORIGINALS_QUERY)
    if (!rows?.length) {
      return []
    }
    return rows.map(mapSanityOriginalToPreview)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[fetchOriginalPreviews] Sanity fetch failed:', error)
    }
    return []
  }
})

export const fetchOriginalSlugs = cache(async (): Promise<string[]> => {
  const client = getSanityClient()
  if (!client) return []

  try {
    const slugs = await client.fetch(ORIGINAL_SLUGS_QUERY)
    return (slugs ?? []).filter((slug: unknown): slug is string => typeof slug === 'string')
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[fetchOriginalSlugs] Sanity fetch failed:', error)
    }
    return []
  }
})

export const fetchOriginalBySlug = cache(
  async (slug: string): Promise<OriginalDetail | null> => {
    const client = getSanityClient()
    if (!client || !slug.trim()) return null

    try {
      const row = await client.fetch(ORIGINAL_BY_SLUG_QUERY, { slug })
      if (!row) return null
      return mapSanityOriginalToDetail(row)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[fetchOriginalBySlug] Sanity fetch failed:', error)
      }
      return null
    }
  },
)
