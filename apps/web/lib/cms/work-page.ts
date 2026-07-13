import 'server-only'

import { cache } from 'react'
import { sanityFetch } from '@/lib/server/sanity'
import { getSanityClient } from '@/sanity/lib/client'
import { isSanityConfigured } from '@/sanity/env'
import { WORK_PAGE_QUERY } from '@/sanity/lib/queries'
import {
  withWorkPageDefaults,
  type SanityWorkPageRow,
  type WorkPageContent,
} from '@/lib/cms/work-page-content'

export type { WorkPageContent }

export const fetchWorkPage = cache(
  async (preview = false): Promise<WorkPageContent> => {
    if (!isSanityConfigured()) {
      return withWorkPageDefaults(null)
    }

    try {
      const row = preview
        ? await sanityFetch<SanityWorkPageRow | null>(WORK_PAGE_QUERY, {
            preview: true,
          })
        : await getSanityClient()?.fetch(WORK_PAGE_QUERY)

      return withWorkPageDefaults(row)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[fetchWorkPage] Sanity fetch failed:', error)
      }
      return withWorkPageDefaults(null)
    }
  },
)
