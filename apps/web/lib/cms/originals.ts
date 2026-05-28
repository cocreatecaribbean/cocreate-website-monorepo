import 'server-only'

import { cache } from 'react'
import type { OriginalPreview } from '@cocreate/types'
import { getSanityClient } from '@/sanity/lib/client'
import { ORIGINALS_QUERY } from '@/sanity/lib/queries'
import { mapSanityOriginalToPreview } from '@/sanity/lib/mappers'

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
