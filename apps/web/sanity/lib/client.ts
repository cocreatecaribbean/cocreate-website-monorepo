import { createClient, type SanityClient } from 'next-sanity'
import { apiVersion, dataset, isSanityConfigured, projectId } from '../env'

let clientInstance: SanityClient | null = null

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
