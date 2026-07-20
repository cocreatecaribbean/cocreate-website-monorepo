'use client'

import AssistantShell from '@cocreate/app-ui/assistant-shell'
import { usePathname, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

const queryDevtoolsLift =
  process.env.NODE_ENV === 'development'
    ? 'bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+4.5rem)] sm:bottom-[calc(max(2rem,env(safe-area-inset-bottom))+4.5rem)]'
    : undefined

export default function AdminCenterAssistant() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()

  const requestExtras = useMemo(
    () => ({
      pathname,
      search: search ? `?${search}` : '',
    }),
    [pathname, search],
  )

  return (
    <AssistantShell
      animation="css"
      context="admin-center"
      api="/api/chat"
      title="Admin help"
      greeting="Hey! Ask me anything about the Admin Center."
      placeholder="e.g. Where do I reply to a client?"
      positionClassName={queryDevtoolsLift}
      requestExtras={requestExtras}
    />
  )
}
