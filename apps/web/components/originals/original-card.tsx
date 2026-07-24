import Image from 'next/image'
import Link from 'next/link'
import type { OriginalPreview } from '@cocreate/types'
import * as fonts from '@/styles/fonts'

const KIND_LABEL: Record<OriginalPreview['contentKind'], string> = {
  podcastSeries: 'Podcast series',
  film: 'Film',
  articleSeries: 'Article series',
}

type OriginalCardProps = {
  item: OriginalPreview
}

export default function OriginalCard({ item }: OriginalCardProps) {
  const href = item.href ?? `/originals/${item.slug}`
  const formatLabel = item.format ?? KIND_LABEL[item.contentKind]

  return (
    <article className="space-y-5">
      <Link href={href} className="group block space-y-5">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-chambray/10">
          {item.coverImageSrc ? (
            <Image
              src={item.coverImageSrc}
              alt=""
              fill
              sizes="(max-width: 767px) 88vw, 640px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : null}
        </div>
        <div>
          <p
            className={`text-xs uppercase tracking-[0.14em] text-casablanca ${fonts.bricolage_grot400.className}`}
          >
            {formatLabel}
          </p>
          <h2 className={`mt-2 text-2xl text-chambray ${fonts.bricolage_grot600.className}`}>
            {item.title}
          </h2>
          {item.description ? (
            <p className={`mt-3 text-lg text-slate-700 ${fonts.bricolage_grot400.className}`}>
              {item.description}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  )
}
