export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-03-01'
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() ?? ''

/** True when Sanity env is set — safe to call createClient */
export function isSanityConfigured(): boolean {
  return projectId.length > 0
}
