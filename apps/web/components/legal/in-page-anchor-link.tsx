'use client'

import type { MouseEvent, ReactNode } from 'react'
import { scrollToInPageTarget } from '@/lib/scroll/in-page-anchor'

type InPageAnchorLinkProps = {
  href: `#${string}`
  children: ReactNode
  className?: string
}

export default function InPageAnchorLink({
  href,
  children,
  className,
}: InPageAnchorLinkProps) {
  const id = href.startsWith('#') ? href.slice(1) : href

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    scrollToInPageTarget(id)
  }

  return (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  )
}
