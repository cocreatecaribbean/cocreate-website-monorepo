import { createClient, type SanityClient } from 'next-sanity'
import { apiVersion, dataset, isSanityConfigured, projectId } from '../env'

let clientInstance: SanityClient | null = null
let stegaClientInstance: SanityClient | null = null

function getStudioUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ??
    (process.env.NODE_ENV === 'production'
      ? 'https://hq.cocreatecaribbean.com'
      : 'http://localhost:3333')
  )
}

/**
 * Returns a Sanity client only when `NEXT_PUBLIC_SANITY_PROJECT_ID` is set.
 * Avoids throwing at module load when env is missing (static fallback mode).
 */
export function getSanityClient(): SanityClient | null {
  if (!isSanityConfigured()) return null

  if (!clientInstance) {
    clientInstance = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
    })
  }

  return clientInstance
}

/** Stega-enabled client for Sanity Live Content and visual editing overlays. */
export function getStegaSanityClient(): SanityClient | null {
  if (!isSanityConfigured()) return null

  if (!stegaClientInstance) {
    stegaClientInstance = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
      stega: {
        studioUrl: getStudioUrl(),
      },
    })
  }

  return stegaClientInstance
}

export const sanityClient = getStegaSanityClient()
