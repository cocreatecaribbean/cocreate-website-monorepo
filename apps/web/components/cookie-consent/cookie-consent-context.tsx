'use client'

import { createContext, useContext } from 'react'

export type CookieConsentContextValue = {
  analyticsAllowed: boolean
  hasAnswered: boolean
  acceptAll: () => void
  rejectOptional: () => void
}

export const CookieConsentContext = createContext<CookieConsentContextValue | null>(null)

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider')
  }
  return context
}
