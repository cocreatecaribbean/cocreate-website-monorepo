'use client'

import Link from 'next/link'
import { useLayoutEffect, useRef, type ReactNode } from 'react'

/** Mobile work tiles — inline so iOS respects it (between 2rem original and 4rem) */
const RADIUS_TOUCH = '3rem'
const RADIUS_DESKTOP = '1.65rem'
const RADIUS_DESKTOP_LG = '2rem'

function isTouchDevice() {
  return window.matchMedia('(hover: none), (pointer: coarse)').matches
}

function radiusForViewport() {
  if (isTouchDevice()) return RADIUS_TOUCH
  return window.matchMedia('(min-width: 1024px)').matches
    ? RADIUS_DESKTOP_LG
    : RADIUS_DESKTOP
}

function applyTileRadius(shell: HTMLElement) {
  const radius = radiusForViewport()
  const clip = shell.querySelector<HTMLElement>('.work-tile-card__clip')

  shell.style.setProperty('border-radius', radius)
  shell.style.setProperty('overflow', 'hidden')

  if (clip) {
    clip.style.setProperty('border-radius', radius)
    clip.style.setProperty('overflow', 'hidden')
    clip.style.setProperty('-webkit-clip-path', `inset(0 round ${radius})`)
    clip.style.setProperty('clip-path', `inset(0 round ${radius})`)
  }
}

type WorkTileShellProps = {
  href?: string
  className: string
  children: ReactNode
}

export default function WorkTileShell({
  href,
  className,
  children,
}: WorkTileShellProps) {
  const ref = useRef<HTMLAnchorElement | HTMLElement>(null)

  useLayoutEffect(() => {
    const shell = ref.current
    if (!shell) return

    applyTileRadius(shell)

    const mq = window.matchMedia(
      '(hover: none), (pointer: coarse), (min-width: 1024px)',
    )
    const onChange = () => applyTileRadius(shell)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  if (href) {
    return (
      <Link ref={ref as React.RefObject<HTMLAnchorElement>} href={href} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <article ref={ref as React.RefObject<HTMLElement>} className={className}>
      {children}
    </article>
  )
}
