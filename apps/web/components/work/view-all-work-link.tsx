'use client'

import Link from 'next/link'
import type { MouseEvent } from 'react'
import { useSyncExternalStore } from 'react'
import { useIsPresentationTool } from 'next-sanity/hooks'
import * as fonts from '@/styles/fonts'

type ViewAllWorkLinkProps = {
  className?: string
}

function subscribeNoop() {
  return () => {}
}

function getIsPreviewIframe() {
  return typeof window !== 'undefined' && window.self !== window.top
}

export default function ViewAllWorkLink({ className = '' }: ViewAllWorkLinkProps) {
  // Always <Link> for stable markup. Presentation iframe: hard-assign restores draft SSR.
  const isPresentationTool = Boolean(useIsPresentationTool())
  const isPreviewIframe = useSyncExternalStore(
    subscribeNoop,
    getIsPreviewIframe,
    () => false,
  )
  const hardNav = isPresentationTool || isPreviewIframe

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!hardNav) return
    event.preventDefault()
    window.location.assign('/work')
  }

  return (
    <Link
      href="/work"
      onClick={onClick}
      className={`
        block w-fit text-sm uppercase tracking-[0.1em] text-sanmarino
        transition-opacity hover:opacity-70
        min-[1024px]:text-base
        ${fonts.bricolage_grot500.className}
        ${className}
      `}
    >
      View all work
    </Link>
  )
}
