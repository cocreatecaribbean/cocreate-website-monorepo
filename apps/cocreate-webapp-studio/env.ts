const LOCAL_PREVIEW_ORIGIN = 'http://localhost:3000'

function normalizePreviewOrigin(raw: string | undefined): string {
  const value = raw?.trim()
  if (!value) {
    return LOCAL_PREVIEW_ORIGIN
  }

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  return withProtocol.replace(/\/+$/, '')
}

const rawPreviewUrl = process.env.SANITY_STUDIO_PREVIEW_URL

export const projectId =
  process.env.SANITY_STUDIO_PROJECT_ID ??
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??
  '5ix7h4ht'

const isProductionBuild = process.env.NODE_ENV === 'production'
const isVercelBuild = Boolean(process.env.VERCEL)
const isLocalDevServer = !isVercelBuild && !isProductionBuild

export const dataset =
  process.env.SANITY_STUDIO_DATASET ??
  process.env.NEXT_PUBLIC_SANITY_DATASET ??
  (isProductionBuild || process.env.VERCEL_ENV === 'production'
    ? 'production'
    : 'dev')

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

export const previewOrigin = normalizePreviewOrigin(rawPreviewUrl)

const isHostedProductionBuild =
  process.env.VERCEL_ENV === 'production' || isProductionBuild

if (isHostedProductionBuild) {
  if (!rawPreviewUrl?.trim()) {
    throw new Error(
      '[studio] SANITY_STUDIO_PREVIEW_URL is required for production builds. ' +
        'Set it to your public website origin (e.g. https://cocreatecaribbean.com), not the Studio URL. ' +
        'Vercel-hosted Studio bakes this at build time — redeploy after changing the env var.',
    )
  }

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(previewOrigin)) {
    throw new Error(
      `[studio] SANITY_STUDIO_PREVIEW_URL must not be localhost in production (got "${previewOrigin}"). ` +
        'Set it on the Studio Vercel project and trigger a new deploy.',
    )
  }
}
