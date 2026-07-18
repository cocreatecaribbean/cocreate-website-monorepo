'use client'

import AssistantShell from '@cocreate/app-ui/assistant-shell'
import { usePathname, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { CONTROL_CENTER_VIEW_QUERY } from '@/lib/control-center/nav'

const queryDevtoolsLift =
  process.env.NODE_ENV === 'development'
    ? 'bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+4.5rem)] sm:bottom-[calc(max(2rem,env(safe-area-inset-bottom))+4.5rem)]'
    : undefined

export default function ClientPortalAssistant() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')
  const ccView = searchParams.get(CONTROL_CENTER_VIEW_QUERY)
  const search = searchParams.toString()

  const requestExtras = useMemo(
    () => ({
      pathname,
      search: search ? `?${search}` : '',
      tab,
      ccView,
    }),
    [pathname, search, tab, ccView],
  )

  return (
    <AssistantShell
      animation="css"
      context="client-portal"
      api="/api/chat"
      title="Portal help"
      greeting="Hi! Ask how to use the Client Portal."
      placeholder="e.g. Where do I message CoCreate?"
      positionClassName={queryDevtoolsLift}
      requestExtras={requestExtras}
    />
  )
}
