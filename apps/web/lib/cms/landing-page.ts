import 'server-only'

import { cache } from 'react'
import { sanityFetch } from '@/lib/server/sanity'
import { getSanityClient } from '@/sanity/lib/client'
import { isSanityConfigured } from '@/sanity/env'
import { LANDING_PAGE_QUERY } from '@/sanity/lib/queries'
import {
  withLandingPageDefaults,
  type LandingPageContent,
  type SanityLandingPageRow,
} from '@/lib/cms/landing-page-content'

export type { LandingPageContent }

export const fetchLandingPage = cache(
  async (preview = false): Promise<LandingPageContent> => {
    if (!isSanityConfigured()) {
      return withLandingPageDefaults(null)
    }

    try {
      const row = preview
        ? await sanityFetch<SanityLandingPageRow | null>(LANDING_PAGE_QUERY, {
            preview: true,
          })
        : await getSanityClient()?.fetch(LANDING_PAGE_QUERY)

      return withLandingPageDefaults(row)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[fetchLandingPage] Sanity fetch failed:', error)
      }
      return withLandingPageDefaults(null)
    }
  },
)
