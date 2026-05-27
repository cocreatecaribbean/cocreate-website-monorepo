import 'server-only'

import { cache } from 'react'
import type { OriginalPreview } from '@cocreate/types'
import { getSanityClient } from '@/sanity/lib/client'
import { ORIGINALS_QUERY } from '@/sanity/lib/queries'
import { mapSanityOriginalToPreview } from '@/sanity/lib/mappers'
import { originalPreviews } from '@/site-info/originals-data'

export const fetchOriginalPreviews = cache(async (): Promise<OriginalPreview[]> => {
  const client = getSanityClient()
  if (!client) {
    return originalPreviews
  }

  try {
    const rows = await client.fetch(ORIGINALS_QUERY)
    if (!rows?.length) {
      return originalPreviews
    }
    return rows.map(mapSanityOriginalToPreview)
  } catch {
    return originalPreviews
  }
})
