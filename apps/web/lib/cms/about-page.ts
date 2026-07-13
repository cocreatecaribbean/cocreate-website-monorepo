import 'server-only'

import { cache } from 'react'
import { sanityFetch } from '@/lib/server/sanity'
import { getSanityClient } from '@/sanity/lib/client'
import { isSanityConfigured } from '@/sanity/env'
import { ABOUT_PAGE_QUERY } from '@/sanity/lib/queries'
import {
  withAboutPageDefaults,
  type AboutPageContent,
  type SanityAboutPageRow,
} from '@/lib/cms/about-page-content'

export type { AboutPageContent }

export const fetchAboutPage = cache(
  async (preview = false): Promise<AboutPageContent> => {
    if (!isSanityConfigured()) {
      return withAboutPageDefaults(null)
    }

    try {
      const row = preview
        ? await sanityFetch<SanityAboutPageRow | null>(ABOUT_PAGE_QUERY, {
            preview: true,
          })
        : await getSanityClient()?.fetch(ABOUT_PAGE_QUERY)

      return withAboutPageDefaults(row ?? null)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[fetchAboutPage] Sanity fetch failed:', error)
      }
      return withAboutPageDefaults(null)
    }
  },
)
