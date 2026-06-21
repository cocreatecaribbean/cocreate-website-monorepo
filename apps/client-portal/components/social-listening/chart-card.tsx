'use client'

import type { ReactNode } from 'react'
import { bricolage_grot600 } from '@client-portal/styles/fonts'

type ChartCardProps = {
  title: string
  description?: string
  accent?: boolean
  /** Avoid stretching to match sibling cards in a grid row (e.g. stream chart) */
  compact?: boolean
  delayClass?: string
  className?: string
  headerAction?: ReactNode
  children: ReactNode
}

export default function ChartCard({
  title,
  description,
  accent = false,
  compact = false,
  delayClass = '',
  className = '',
  headerAction,
  children,
}: ChartCardProps) {
  return (
    <article
      className={`
        portal-glass-card portal-shine-hover group portal-animate-in flex min-h-0 flex-col overflow-hidden
        transition duration-500 hover:shadow-[0_20px_56px_rgba(64,110,181,0.16)] dark:hover:shadow-[0_20px_56px_rgba(0,0,0,0.35)]
        ${compact ? 'h-auto' : 'h-full'}
        ${delayClass}
        ${accent ? 'ring-sanmarino/20' : ''}
        ${className}
      `}
    >
      <header
        className={`
          portal-chart-card-header shrink-0 border-b px-5 py-4 backdrop-blur-sm sm:px-6
          ${
            accent
              ? 'border-white/40 bg-linear-to-r from-sanmarino/15 via-chambray/5 to-casablanca/15 backdrop-blur-md dark:border-white/10'
              : ''
          }
        `}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className={`text-base text-app-heading sm:text-lg ${bricolage_grot600.className}`}
            >
              {title}
            </h3>
            {description ? (
              <p className="portal-sl-body mt-1 text-sm leading-relaxed">{description}</p>
            ) : null}
          </div>
          {headerAction ? (
            <div className="shrink-0">{headerAction}</div>
          ) : null}
        </div>
      </header>
      <div
        className={`portal-chart-card-body p-4 sm:p-5 ${compact ? '' : 'min-h-0 flex-1'}`}
      >
        {children}
      </div>
    </article>
  )
}
