'use client'

import { useEffect, type ReactNode } from 'react'

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
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const asideClassName = [
    'portal-drawer-aside',
    open ? 'portal-drawer-aside--open' : 'portal-drawer-aside--closed',
    variant === 'persistent' ? 'portal-drawer-aside--persistent' : 'portal-drawer-aside--overlay',
  ].join(' ')

  const drawer = (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          className="portal-drawer-backdrop"
          onClick={() => onOpenChange(false)}
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
