'use client'

import AssistantShell from '@cocreate/app-ui/assistant-shell'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { firstNameFromDisplayName } from '@/lib/assistant/prompts'
import { CONTROL_CENTER_VIEW_QUERY } from '@/lib/control-center/nav'
import { usePortalProfileQuery } from '@/lib/api/queries/team'

const queryDevtoolsLift =
  process.env.NODE_ENV === 'development'
    ? 'bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+4.5rem)] sm:bottom-[calc(max(2rem,env(safe-area-inset-bottom))+4.5rem)]'
    : undefined

export default function ClientPortalAssistant() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')
  const ccView = searchParams.get(CONTROL_CENTER_VIEW_QUERY)
  const search = searchParams.toString()
  const { data: profile } = usePortalProfileQuery()

  const firstName = firstNameFromDisplayName(profile?.user.displayName)
  const greeting = firstName
    ? `Hey ${firstName} — ask me anything about the portal.`
    : 'Hey! Ask me anything about the portal.'

  const requestExtras = useMemo(
    () => ({
      pathname,
      search: search ? `?${search}` : '',
      tab,
      ccView,
    }),
    [pathname, search, tab, ccView],
  )

  const onNavigate = useCallback(
    (href: string) => {
      router.push(href)
    },
    [router],
  )

  return (
    <AssistantShell
      animation="css"
      context="client-portal"
      api="/api/chat"
      title="Portal help"
      greeting={greeting}
      placeholder="e.g. Where do I message CoCreate?"
      positionClassName={queryDevtoolsLift}
      requestExtras={requestExtras}
      onNavigate={onNavigate}
    />
  )
}
