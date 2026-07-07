'use client'

import AssistantShell from '@cocreate/app-ui/assistant-shell'
import { useCookieConsent } from '@/components/cookie-consent/cookie-consent-context'

/** Clearance above TanStack Query devtools (dev-only, bottom-right). */
const queryDevtoolsLift =
  process.env.NODE_ENV === 'development'
    ? 'bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+4.5rem)] sm:bottom-[calc(max(2rem,env(safe-area-inset-bottom))+4.5rem)]'
    : undefined

export default function MarketingAssistant() {
  const { hasAnswered } = useCookieConsent()

  return (
    <AssistantShell
      animation="gsap"
      context="marketing"
      api="/api/chat"
      title="Ask CoCreate"
      greeting="Hi CoCreator!"
      placeholder="Ask about our services, work, or how to get in touch..."
      positionClassName={
        hasAnswered
          ? queryDevtoolsLift
          : 'bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+18.5rem)] sm:bottom-[calc(max(2rem,env(safe-area-inset-bottom))+17rem)]'
      }
    />
  )
}
