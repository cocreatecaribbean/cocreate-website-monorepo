'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  SOCIAL_LISTENING_NAV,
  SOCIAL_LISTENING_REPORTS,
  SOCIAL_LISTENING_VIEW_QUERY,
  type SocialListeningViewId,
} from '@cocreate/social-listening/data-source'

type SocialListeningMobileSubNavProps = {
  activeView: SocialListeningViewId
  onSelectView: (view: SocialListeningViewId) => void
}

const MOBILE_NAV = [...SOCIAL_LISTENING_NAV, SOCIAL_LISTENING_REPORTS]

export default function SocialListeningMobileSubNav({
  activeView,
  onSelectView,
}: SocialListeningMobileSubNavProps) {
  return (
    <nav
      className="portal-sl-mobile-nav -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden"
      aria-label="Social listening views"
    >
      {MOBILE_NAV.map((item) => {
        const active = activeView === item.id
        const Icon = item.icon
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectView(item.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition ${
              active
                ? 'border-sanmarino/50 bg-sanmarino/15 text-chambray shadow-sm'
                : 'border-app bg-app-input text-app-muted hover:border-sanmarino/30'
            }`}
          >
            <Icon className="size-3.5" aria-hidden />
            {item.shortLabel}
          </button>
        )
      })}
    </nav>
  )
}

/** Standalone hook export for pages that need mobile nav outside layout shell */
export function useSocialListeningViewNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setActiveView = (view: SocialListeningViewId) => {
    const params = new URLSearchParams(searchParams.toString())
    if (view === 'summary') {
      params.delete(SOCIAL_LISTENING_VIEW_QUERY)
    } else {
      params.set(SOCIAL_LISTENING_VIEW_QUERY, view)
    }
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return { setActiveView }
}
