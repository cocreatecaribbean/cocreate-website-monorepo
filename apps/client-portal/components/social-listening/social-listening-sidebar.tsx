'use client'

import {
  SOCIAL_LISTENING_NAV,
  SOCIAL_LISTENING_REPORTS,
  type SocialListeningNavItem,
  type SocialListeningViewId,
} from '@/lib/social-listening/nav'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import { Plus } from 'lucide-react'
import type { MentionSnapshotHint } from '@/lib/social-listening/mention-snapshot-hint'

type SocialListeningSidebarProps = {
  activeView: SocialListeningViewId
  onSelectView: (view: SocialListeningViewId) => void
  organizationName?: string | null
  mentionHint?: MentionSnapshotHint
}

function NavButton({
  item,
  active,
  onSelect,
}: {
  item: SocialListeningNavItem
  active: boolean
  onSelect: () => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'page' : undefined}
      title={item.description}
      className={`
        portal-sl-nav-item group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition
        ${bricolage_grot600.className}
        ${
          active
            ? 'bg-white/12 text-casablanca shadow-[inset_3px_0_0_0] shadow-casablanca'
            : 'text-white/75 hover:bg-white/8 hover:text-white'
        }
      `}
    >
      <Icon
        className={`h-4 w-4 shrink-0 ${active ? 'text-casablanca' : 'text-white/50 group-hover:text-white/80'}`}
        aria-hidden
      />
      <span>{item.label}</span>
    </button>
  )
}

export default function SocialListeningSidebar({
  activeView,
  onSelectView,
  organizationName,
  mentionHint,
}: SocialListeningSidebarProps) {
  const projectLabel = organizationName?.trim() || 'Your brand'

  return (
    <aside
      className="portal-sl-sidebar flex h-full min-h-0 flex-col"
      aria-label="Social listening navigation"
    >
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-[0.65rem] font-semibold tracking-[0.22em] text-white/45 uppercase ${bricolage_grot700.className}`}
          >
            Projects
          </p>
          <button
            type="button"
            disabled
            aria-label="Add project (coming soon)"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-casablanca/90 text-chambray opacity-60"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
        <p
          className={`mt-3 truncate text-sm font-semibold tracking-wide text-white uppercase ${bricolage_grot700.className}`}
        >
          {projectLabel}
        </p>
        {mentionHint ? (
          <p className="mt-1.5 text-xs leading-snug text-white/55">
            {mentionHint.mentionsLine}
            {mentionHint.dateLine ? (
              <>
                <br />
                {mentionHint.dateLine}
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {SOCIAL_LISTENING_NAV.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={activeView === item.id}
            onSelect={() => onSelectView(item.id)}
          />
        ))}
      </nav>

      <div className="border-t border-white/10 px-2 py-3">
        <NavButton
          item={SOCIAL_LISTENING_REPORTS}
          active={activeView === SOCIAL_LISTENING_REPORTS.id}
          onSelect={() => onSelectView(SOCIAL_LISTENING_REPORTS.id)}
        />
      </div>
    </aside>
  )
}
