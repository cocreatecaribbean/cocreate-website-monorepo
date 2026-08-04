/**
 * Marketing site origin for cross-app links (Privacy, logo home, etc.).
 * NEXT_PUBLIC_WEB_URL is inlined at build time — must be set per Doppler/Vercel env.
 */
export function getMarketingSiteOrigin(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_WEB_URL?.trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  return null
}

export function getMarketingPrivacyUrl(): string | null {
  const origin = getMarketingSiteOrigin()
  return origin ? `${origin}/privacy` : null
}

export function getMarketingCookiesUrl(): string | null {
  const privacy = getMarketingPrivacyUrl()
  return privacy ? `${privacy}#cookies` : null
}

let warnedMissingWebUrl = false

/** Log once in production builds when NEXT_PUBLIC_WEB_URL was not baked in. */
export function warnIfMarketingSiteUrlMissing(): void {
  if (warnedMissingWebUrl) return
  if (getMarketingSiteOrigin()) return
  if (process.env.NODE_ENV === 'development') return
  warnedMissingWebUrl = true
  console.error(
    '[client-portal] NEXT_PUBLIC_WEB_URL is unset — Privacy/marketing links are hidden. Set it in Doppler for this env and redeploy.',
  )
}
