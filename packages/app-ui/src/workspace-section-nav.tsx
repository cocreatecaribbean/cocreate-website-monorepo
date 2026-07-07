'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

export type WorkspaceSectionNavIcon = ComponentType<{
  className?: string
  'aria-hidden'?: boolean
}>

import NavTooltip from './nav-tooltip'

export type WorkspaceSectionNavItem<T extends string> = {
  id: T
  label: string
  description?: string
  icon?: WorkspaceSectionNavIcon
  badge?: number | string
  ariaLabel?: string
}

export type WorkspaceSectionNavProps<T extends string> = {
  items: WorkspaceSectionNavItem<T>[]
  activeId: T
  onSelect: (id: T) => void
  ariaLabel: string
  onItemHover?: (id: T) => void
  inputClassName?: string
  pillClassName?: string
  className?: string
}

function formatItemLabel(item: WorkspaceSectionNavItem<string>): string {
  const badge = item.badge
  if (badge !== undefined && badge !== '' && badge !== 0) {
    return `${item.label} (${badge})`
  }
  return item.label
}

function itemAriaLabel(item: WorkspaceSectionNavItem<string>): string {
  return item.ariaLabel ?? formatItemLabel(item)
}

function NavBadge({ badge }: { badge: number | string }) {
  return (
    <span className="rounded-full bg-casablanca/30 px-1.5 text-xs tabular-nums">{badge}</span>
  )
}

function MenuChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-chambray/70 transition-transform dark:text-casablanca/80 ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export default function WorkspaceSectionNav<T extends string>({
  items,
  activeId,
  onSelect,
  ariaLabel,
  onItemHover,
  inputClassName = 'admin-input',
  pillClassName = 'font-semibold',
  className,
}: WorkspaceSectionNavProps<T>) {
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(() =>
    Math.max(
      0,
      items.findIndex((item) => item.id === activeId),
    ),
  )

  const activeItem = items.find((item) => item.id === activeId)
  const activeIndex = items.findIndex((item) => item.id === activeId)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setHighlightIndex(activeIndex >= 0 ? activeIndex : 0)
    }
  }, [open, activeIndex])

  const selectItem = useCallback(
    (id: T) => {
      onSelect(id)
      setOpen(false)
    },
    [onSelect],
  )

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen(true)
      setHighlightIndex(activeIndex >= 0 ? activeIndex : 0)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setHighlightIndex(items.length - 1)
    }
  }

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightIndex((index) => (index + 1) % items.length)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightIndex((index) => (index - 1 + items.length) % items.length)
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      setHighlightIndex(0)
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      setHighlightIndex(items.length - 1)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const item = items[highlightIndex]
      if (item) selectItem(item.id)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    }
  }

  const ActiveIcon = activeItem?.icon

  return (
    <div className={className ?? 'mt-4'}>
      <div ref={rootRef} className="relative md:hidden">
        <button
          type="button"
          id={menuId}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${menuId}-listbox`}
          aria-label={activeItem ? itemAriaLabel(activeItem) : ariaLabel}
          onClick={() => setOpen((value) => !value)}
          onKeyDown={handleTriggerKeyDown}
          className={`${inputClassName} flex items-center justify-between gap-3 text-left`}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
            {ActiveIcon ? (
              <ActiveIcon className="h-3.5 w-3.5 shrink-0 text-chambray dark:text-casablanca" aria-hidden />
            ) : null}
            <span className="truncate">{activeItem ? formatItemLabel(activeItem) : ariaLabel}</span>
            {activeItem &&
            activeItem.badge !== undefined &&
            activeItem.badge !== '' &&
            activeItem.badge !== 0 ? (
              <NavBadge badge={activeItem.badge} />
            ) : null}
          </span>
          <MenuChevron open={open} />
        </button>

        {open ? (
          <ul
            id={`${menuId}-listbox`}
            role="listbox"
            aria-label={ariaLabel}
            tabIndex={-1}
            onKeyDown={handleMenuKeyDown}
            className="portal-field-menu absolute top-[calc(100%+0.375rem)] right-0 left-0 z-50 max-h-[min(20rem,60vh)] overflow-y-auto py-1"
          >
            {items.map((item, index) => {
              const Icon = item.icon
              const active = item.id === activeId
              const highlighted = index === highlightIndex
              return (
                <li key={item.id} role="presentation">
                  <NavTooltip description={item.description} side="top" className="w-full">
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      tabIndex={highlighted ? 0 : -1}
                      ref={(node) => {
                        if (highlighted && open) node?.focus()
                      }}
                      className={`portal-field-menu-item w-full ${active ? 'portal-field-menu-item--active' : ''}`}
                      onClick={() => selectItem(item.id)}
                      onMouseEnter={() => {
                        setHighlightIndex(index)
                        onItemHover?.(item.id)
                      }}
                      onFocus={() => {
                        setHighlightIndex(index)
                        onItemHover?.(item.id)
                      }}
                    >
                      {Icon ? (
                        <Icon className="portal-field-menu-item-icon" aria-hidden />
                      ) : null}
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge !== undefined && item.badge !== '' && item.badge !== 0 ? (
                        <NavBadge badge={item.badge} />
                      ) : null}
                    </button>
                  </NavTooltip>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>

      <nav className="hidden flex-wrap gap-2 md:flex" aria-label={ariaLabel}>
        {items.map((item) => {
          const Icon = item.icon
          const active = item.id === activeId
          return (
            <NavTooltip key={item.id} description={item.description} side="top">
              <NavPillButton
                active={active}
                pillClassName={pillClassName}
                ariaLabel={itemAriaLabel(item)}
                onClick={() => onSelect(item.id)}
                onMouseEnter={onItemHover ? () => onItemHover(item.id) : undefined}
                onFocus={onItemHover ? () => onItemHover(item.id) : undefined}
                icon={Icon ? <Icon className="h-3.5 w-3.5" aria-hidden /> : null}
                badge={
                  item.badge !== undefined && item.badge !== '' && item.badge !== 0 ? (
                    <NavBadge badge={item.badge} />
                  ) : null
                }
              >
                {item.label}
              </NavPillButton>
            </NavTooltip>
          )
        })}
      </nav>
    </div>
  )
}

function NavPillButton({
  active,
  pillClassName,
  ariaLabel,
  onClick,
  onMouseEnter,
  onFocus,
  icon,
  badge,
  children,
}: {
  active: boolean
  pillClassName: string
  ariaLabel: string
  onClick: () => void
  onMouseEnter?: () => void
  onFocus?: () => void
  icon: ReactNode
  badge: ReactNode
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      aria-label={ariaLabel}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm transition ${pillClassName} ${
        active
          ? 'bg-chambray text-white'
          : 'bg-chambray/8 text-chambray hover:bg-chambray/12'
      }`}
    >
      {icon}
      {children}
      {badge}
    </button>
  )
}
