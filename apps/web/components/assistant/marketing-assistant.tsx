'use client'

import AssistantShell from '@cocreate/app-ui/assistant-shell'

/** Clearance above TanStack Query Devtools (dev-only, bottom-right). */
const queryDevtoolsLift =
  process.env.NODE_ENV === 'development'
    ? 'bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+4.5rem)] sm:bottom-[calc(max(2rem,env(safe-area-inset-bottom))+4.5rem)]'
    : undefined

export default function MarketingAssistant() {
  return (
    <AssistantShell
      animation="gsap"
      context="marketing"
      api="/api/chat"
      title="Ask CoCreate"
      greeting="Hi CoCreator!"
      placeholder="Ask about our services, work, or how to get in touch..."
      positionClassName={queryDevtoolsLift}
    />
  )
}
