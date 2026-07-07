'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  CONSENT_CHANGE_EVENT,
  readConsent,
  writeConsent,
  type CookieConsent,
} from '@/lib/cookie-consent'
import AnalyticsScripts from '@/components/cookie-consent/analytics-scripts'
import CookieConsentBanner from '@/components/cookie-consent/cookie-consent-banner'
import { CookieConsentContext } from '@/components/cookie-consent/cookie-consent-context'

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setConsent(readConsent())
    setMounted(true)

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsent>).detail
      setConsent(detail ?? readConsent())
    }
    window.addEventListener(CONSENT_CHANGE_EVENT, onChange)
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange)
  }, [])

  const acceptAll = useCallback(() => {
    setConsent(writeConsent(true))
  }, [])

  const rejectOptional = useCallback(() => {
    setConsent(writeConsent(false))
  }, [])

  const value = useMemo(
    () => ({
      analyticsAllowed: consent?.analytics === true,
      hasAnswered: consent !== null,
      acceptAll,
      rejectOptional,
    }),
    [acceptAll, consent, rejectOptional],
  )

  const showBanner = mounted && consent === null

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {showBanner ? <CookieConsentBanner /> : null}
      <AnalyticsScripts />
    </CookieConsentContext.Provider>
  )
}
