'use client'

import { useCookieConsent } from '@/components/cookie-consent/cookie-consent-context'

/**
 * Gate optional analytics scripts behind cookie consent.
 * Add GA/GTM next/script tags here when IDs are configured.
 */
export default function AnalyticsScripts() {
  const { analyticsAllowed } = useCookieConsent()

  if (!analyticsAllowed) {
    return null
  }

  // Example:
  // if (process.env.NEXT_PUBLIC_GA_ID) {
  //   return <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
  // }

  return null
}
