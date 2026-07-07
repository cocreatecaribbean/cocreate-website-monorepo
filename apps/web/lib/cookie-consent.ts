export const CONSENT_COOKIE_NAME = 'cc_cookie_consent'
export const CONSENT_CHANGE_EVENT = 'cookie-consent-change'
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

export type CookieConsent = {
  essential: true
  analytics: boolean
  answeredAt: string
}

function parseConsentCookie(value: string | undefined): CookieConsent | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<CookieConsent>
    if (typeof parsed.analytics !== 'boolean' || typeof parsed.answeredAt !== 'string') {
      return null
    }
    return {
      essential: true,
      analytics: parsed.analytics,
      answeredAt: parsed.answeredAt,
    }
  } catch {
    return null
  }
}

export function readConsent(): CookieConsent | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`))
  const value = match?.split('=').slice(1).join('=')
  return parseConsentCookie(value)
}

export function hasAnsweredConsent(): boolean {
  return readConsent() !== null
}

export function writeConsent(analytics: boolean): CookieConsent {
  const consent: CookieConsent = {
    essential: true,
    analytics,
    answeredAt: new Date().toISOString(),
  }
  if (typeof document !== 'undefined') {
    const encoded = encodeURIComponent(JSON.stringify(consent))
    document.cookie = `${CONSENT_COOKIE_NAME}=${encoded}; path=/; max-age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax`
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: consent }))
  }
  return consent
}

export function analyticsAllowed(): boolean {
  return readConsent()?.analytics === true
}
