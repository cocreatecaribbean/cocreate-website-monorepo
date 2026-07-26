import Image from 'next/image'
import Link from 'next/link'
import type { OriginalPreview } from '@cocreate/types'
import {
  ORIGINAL_DEFAULT_WATCH_BUTTON,
  ORIGINAL_DEFAULT_WATCH_BUTTON_TEXT,
} from '@/components/originals/original-brand-defaults'
import { surfaceFillStyle } from '@/components/originals/surface-fill-style'
import { headlineFillStyle } from '@/components/work/sections/headline-fill-style'
import * as fonts from '@/styles/fonts'

type OriginalCardProps = {
  item: OriginalPreview
}

export default function OriginalCard({ item }: OriginalCardProps) {
  const href = item.href ?? `/originals/${item.slug}`
  const watchSurface = surfaceFillStyle(item.watchButtonFill, ORIGINAL_DEFAULT_WATCH_BUTTON)
  const watchLabel = headlineFillStyle(item.watchButtonTextFill, '')
  const watchLabelStyle =
    item.watchButtonTextFill == null
      ? { color: ORIGINAL_DEFAULT_WATCH_BUTTON_TEXT }
      : watchLabel.style

  return (
    <article className="overflow-hidden rounded-[2rem] bg-white shadow-[0_12px_40px_rgba(30,45,90,0.12)] ring-1 ring-chambray/8">
      <div className="grid min-h-[280px] min-[900px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="relative z-10 flex flex-col items-center justify-center gap-8 px-8 py-12 min-[900px]:px-12">
          {item.logoSrc ? (
            <div className="relative h-36 w-full max-w-[220px] min-[900px]:h-44">
              <Image
                src={item.logoSrc}
                alt={item.title}
                fill
                sizes="220px"
                className="object-contain"
              />
            </div>
          ) : (
            <h2
              className={`text-center text-2xl text-chambray min-[900px]:text-3xl ${fonts.bricolage_grot700.className}`}
            >
              {item.title}
            </h2>
          )}

          <Link
            href={href}
            className={`inline-flex items-center gap-2.5 rounded-full px-7 py-3 text-base transition-transform duration-300 hover:scale-[1.03] ${fonts.bricolage_grot600.className} ${watchLabel.className}`}
            style={{ ...watchSurface, ...watchLabelStyle }}
          >
            Watch
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-current"
              aria-hidden
            >
              <svg viewBox="0 0 12 12" className="ml-0.5 h-3 w-3 fill-current" aria-hidden>
                <path d="M3 1.5v9l7.5-4.5L3 1.5z" />
              </svg>
            </span>
          </Link>
        </div>

        <Link
          href={href}
          className="group relative min-h-[220px] overflow-hidden min-[900px]:min-h-full"
          aria-label={`Watch ${item.title}`}
        >
          {item.coverImageSrc ? (
            <Image
              src={item.coverImageSrc}
              alt=""
              fill
              sizes="(max-width: 899px) 88vw, 640px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 bg-chambray/10" />
          )}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-white to-transparent min-[900px]:w-36"
            aria-hidden
          />
        </Link>
      </div>
    </article>
  )
}
