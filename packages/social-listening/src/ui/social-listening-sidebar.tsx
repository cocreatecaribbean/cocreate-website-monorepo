'use client'

import {
  DEFAULT_SETTINGS_NAV,
  SOCIAL_LISTENING_NAV,
  SOCIAL_LISTENING_REPORTS,
  type SocialListeningNavItem,
  type SocialListeningViewId,
} from '@cocreate/social-listening/data-source'
import type { MentionSnapshotHint } from '@cocreate/social-listening/core'
import { Plus } from 'lucide-react'
import { slFontSemibold, slFontBold } from './typography'

type SocialListeningSidebarProps = {
  activeView: SocialListeningViewId
  onSelectView: (view: SocialListeningViewId) => void
  settingsActive: boolean
  onOpenSettings: () => void
  organizationName?: string | null
  mentionHint?: MentionSnapshotHint
  showSettings?: boolean
  showSetupShortcut?: boolean
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
        ${slFontSemibold}
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

const settingsNavItem: SocialListeningNavItem = {
  id: 'summary',
  label: DEFAULT_SETTINGS_NAV.label,
  description: DEFAULT_SETTINGS_NAV.description,
  icon: DEFAULT_SETTINGS_NAV.icon,
}

export default function SocialListeningSidebar({
  activeView,
  onSelectView,
  settingsActive,
  onOpenSettings,
  organizationName,
  mentionHint,
  showSettings = true,
  showSetupShortcut = true,
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
            className={`text-[0.65rem] font-semibold tracking-[0.22em] text-white/45 uppercase ${slFontBold}`}
          >
            Projects
          </p>
          {showSetupShortcut ? (
            <button
              type="button"
              onClick={() => onSelectView('setup')}
              aria-label="Create new listening setup"
              title="New listening setup"
              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-casablanca/90 text-chambray transition hover:bg-casablanca hover:ring-2 hover:ring-casablanca/40"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
        <p
          className={`mt-3 truncate text-sm font-semibold tracking-wide text-white uppercase ${slFontBold}`}
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
            active={!settingsActive && activeView === item.id}
            onSelect={() => onSelectView(item.id)}
          />
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-white/10 px-2 py-3">
        <NavButton
          item={SOCIAL_LISTENING_REPORTS}
          active={!settingsActive && activeView === SOCIAL_LISTENING_REPORTS.id}
          onSelect={() => onSelectView(SOCIAL_LISTENING_REPORTS.id)}
        />
        {showSettings ? (
          <NavButton
            item={settingsNavItem}
            active={settingsActive}
            onSelect={onOpenSettings}
          />
        ) : null}
      </div>
    </aside>
  )
}
