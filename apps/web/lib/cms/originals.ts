import 'server-only'

import { cache } from 'react'
import type { OriginalDetail, OriginalPreview } from '@cocreate/types'
import { sanityFetch } from '@/lib/server/sanity'
import { isSanityConfigured } from '@/sanity/env'
import { getSanityClient } from '@/sanity/lib/client'
import {
  ORIGINAL_BY_SLUG_PREVIEW_QUERY,
  ORIGINAL_BY_SLUG_QUERY,
  ORIGINAL_SLUGS_QUERY,
  ORIGINALS_PREVIEW_QUERY,
  ORIGINALS_QUERY,
} from '@/sanity/lib/queries'
import {
  mapSanityOriginalToDetail,
  mapSanityOriginalToPreview,
} from '@/sanity/lib/mappers'

export const fetchOriginalPreviews = cache(
  async (preview = false): Promise<OriginalPreview[]> => {
    if (!isSanityConfigured()) return []

    try {
      const rows = preview
        ? await sanityFetch<Record<string, unknown>[] | null>(ORIGINALS_PREVIEW_QUERY, {
            preview: true,
          })
        : await getSanityClient()?.fetch(ORIGINALS_QUERY)

      if (!rows?.length) return []
      return rows.map((row: Record<string, unknown>) =>
        mapSanityOriginalToPreview(
          row as Parameters<typeof mapSanityOriginalToPreview>[0],
        ),
      )
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[fetchOriginalPreviews] Sanity fetch failed:', error)
      }
      return []
    }
  },
)

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
  async (slug: string, preview = false): Promise<OriginalDetail | null> => {
    const key = slug.trim().toLowerCase()
    if (!isSanityConfigured() || !key) return null

    try {
      const row = preview
        ? await sanityFetch<Record<string, unknown> | null>(ORIGINAL_BY_SLUG_PREVIEW_QUERY, {
            preview: true,
            params: { slug: key },
          })
        : await getSanityClient()?.fetch(ORIGINAL_BY_SLUG_QUERY, { slug: key })

      if (!row) return null
      return mapSanityOriginalToDetail(
        row as Parameters<typeof mapSanityOriginalToDetail>[0],
      )
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[fetchOriginalBySlug] Sanity fetch failed:', error)
      }
      return null
    }
  },
)
