const LOCAL_PREVIEW_ORIGIN = 'http://localhost:3000'
/** Staging marketing Presentation target when env is unset on Vercel (first deploy before Doppler). */
const STAGING_PREVIEW_ORIGIN = 'https://preview.cocreatecaribbean.com'

function isLocalhostOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
}

function normalizePreviewOrigin(raw: string | undefined, fallback: string): string {
  const value = raw?.trim()
  if (!value) {
    return fallback
  }

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  return withProtocol.replace(/\/+$/, '')
}

const rawPreviewUrl = process.env.SANITY_STUDIO_PREVIEW_URL

export const projectId =
  process.env.SANITY_STUDIO_PROJECT_ID ??
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??
  '5ix7h4ht'

const isVercelBuild = Boolean(process.env.VERCEL)
const isLocalDevServer = !isVercelBuild && process.env.NODE_ENV !== 'production'

export const dataset =
  process.env.SANITY_STUDIO_DATASET ??
  process.env.NEXT_PUBLIC_SANITY_DATASET ??
  // Staging-first: only default to production when Vercel Production env is set.
  (process.env.VERCEL_ENV === 'production' ? 'production' : 'dev')

if (isLocalDevServer && dataset === 'production') {
  const allowProduction = process.env.SANITY_STUDIO_ALLOW_PRODUCTION === 'true'

  if (!allowProduction) {
    throw new Error(
      '[studio] Refusing to start on the production Sanity dataset in local dev. ' +
        'Run `doppler setup` and select the dev config, or set SANITY_STUDIO_DATASET=dev in Doppler. ' +
        'For intentional prod debugging only, set SANITY_STUDIO_ALLOW_PRODUCTION=true.',
    )
  }
}

// Build must succeed with zero env (Doppler synced after first deploy). Never throw for preview URL.
const previewFallback = isVercelBuild ? STAGING_PREVIEW_ORIGIN : LOCAL_PREVIEW_ORIGIN
let resolvedPreview = normalizePreviewOrigin(rawPreviewUrl, previewFallback)
if (isVercelBuild && isLocalhostOrigin(resolvedPreview)) {
  resolvedPreview = STAGING_PREVIEW_ORIGIN
}

export const previewOrigin = resolvedPreview
