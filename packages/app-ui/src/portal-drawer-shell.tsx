'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Match `.portal-drawer-aside` transform duration so ghost taps cannot hit content underneath. */
const DRAWER_CLOSE_GUARD_MS = 350

export type PortalDrawerShellProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  sidebar: ReactNode
  children: ReactNode
  /** Sticky header row below the desktop breakpoint (e.g. hamburger bar). */
  mobileHeader?: ReactNode
  /**
   * persistent — sidebar is part of the layout at lg+ (admin shell).
   * overlay — drawer only below lg; no persistent sidebar slot (client shell).
   */
  variant?: 'persistent' | 'overlay'
  className?: string
}

export default function PortalDrawerShell({
  open,
  onOpenChange,
  sidebar,
  children,
  mobileHeader,
  variant = 'persistent',
  className,
}: PortalDrawerShellProps) {
  const wasOpenRef = useRef(false)
  const [blockGhostClicks, setBlockGhostClicks] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true
      setBlockGhostClicks(false)
      return
    }
    if (!wasOpenRef.current) return

    // Keep an invisible full-screen catcher briefly after close so the same
    // tap that selected a bottom nav item (e.g. Settings) cannot hit Sign out.
    setBlockGhostClicks(true)
    const timer = window.setTimeout(() => setBlockGhostClicks(false), DRAWER_CLOSE_GUARD_MS)
    return () => window.clearTimeout(timer)
  }, [open])

  const asideClassName = [
    'portal-drawer-aside',
    open ? 'portal-drawer-aside--open' : 'portal-drawer-aside--closed',
    variant === 'persistent' ? 'portal-drawer-aside--persistent' : 'portal-drawer-aside--overlay',
  ].join(' ')

  const showBackdrop = open || blockGhostClicks

  const drawer = (
    <>
      {showBackdrop ? (
        <button
          type="button"
          aria-label={open ? 'Close menu' : undefined}
          aria-hidden={!open}
          tabIndex={open ? 0 : -1}
          className={`portal-drawer-backdrop${blockGhostClicks && !open ? ' portal-drawer-backdrop--linger' : ''}`}
          onClick={() => {
            if (open) onOpenChange(false)
          }}
          onPointerUp={(event) => {
            if (!open) {
              event.preventDefault()
              event.stopPropagation()
            }
          }}
        />
      ) : null}
      <aside className={asideClassName}>{sidebar}</aside>
    </>
  )

  if (variant === 'overlay') {
    return (
      <div className={className}>
        {drawer}
        {children}
      </div>
    )
  }

  return (
    <div className={`flex h-svh overflow-hidden ${className ?? ''}`}>
      {drawer}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {mobileHeader}
        {children}
      </div>
    </div>
  )
}
