'use client'

import type { LucideIcon } from 'lucide-react'
import { bricolage_grot600 } from '@/styles/fonts'

type PortalSectionPlaceholderProps = {
  title: string
  description: string
  icon: LucideIcon
  badge?: string
}

export default function PortalSectionPlaceholder({
  title,
  description,
  icon: Icon,
  badge = 'Coming soon',
}: PortalSectionPlaceholderProps) {
  return (
    <section className="portal-glass-card portal-animate-in flex min-h-[280px] flex-col items-center justify-center p-10 text-center sm:min-h-[360px]">
      <div className="inline-flex rounded-2xl bg-linear-to-br from-sanmarino/15 to-chambray/5 p-4 text-sanmarino ring-1 ring-sanmarino/15">
        <Icon className="h-8 w-8" aria-hidden />
      </div>
      <h3 className={`mt-6 text-lg text-chambray ${bricolage_grot600.className}`}>{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">{description}</p>
      <p className="mt-4 text-xs font-medium tracking-wide text-slate-400 uppercase">{badge}</p>
    </section>
  )
}
