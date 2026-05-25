'use client'

import type { ReactNode } from 'react'
import { bricolage_grot600 } from '@/styles/fonts'

type ChartCardProps = {
  title: string
  description?: string
  accent?: boolean
  /** Avoid stretching to match sibling cards in a grid row (e.g. stream chart) */
  compact?: boolean
  delayClass?: string
  className?: string
  children: ReactNode
}

export default function ChartCard({
  title,
  description,
  accent = false,
  compact = false,
  delayClass = '',
  className = '',
  children,
}: ChartCardProps) {
  return (
    <article
      className={`
        portal-glass-card portal-shine-hover group portal-animate-in flex min-h-0 flex-col overflow-hidden
        transition duration-500 hover:shadow-[0_20px_56px_rgba(64,110,181,0.16)]
        ${compact ? 'h-auto' : 'h-full'}
        ${delayClass}
        ${accent ? 'ring-sanmarino/20' : ''}
        ${className}
      `}
    >
      <header
        className={`
          shrink-0 border-b px-5 py-4 sm:px-6
          ${
            accent
              ? 'border-white/40 bg-linear-to-r from-sanmarino/15 via-chambray/5 to-casablanca/15 backdrop-blur-md'
              : 'border-white/50 bg-white/30 backdrop-blur-sm'
          }
        `}
      >
        <h3 className={`text-base text-chambray sm:text-lg ${bricolage_grot600.className}`}>
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
        ) : null}
      </header>
      <div
        className={`bg-linear-to-b from-white/20 to-transparent p-4 sm:p-5 ${compact ? '' : 'min-h-0 flex-1'}`}
      >
        {children}
      </div>
    </article>
  )
}
