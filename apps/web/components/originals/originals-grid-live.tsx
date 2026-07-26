'use client'

import OriginalCard from '@/components/originals/original-card'
import { useOriginalsLive } from '@/components/originals/originals-cms-provider'
import * as fonts from '@/styles/fonts'

export default function OriginalsGridLive() {
  const originals = useOriginalsLive()

  if (originals.length === 0) {
    return (
      <p
        className={`mx-auto w-[88svw] max-w-[1320px] text-base text-slate-600 ${fonts.bricolage_grot400.className}`}
        role="status"
      >
        No originals to show yet.
      </p>
    )
  }

  return (
    <section className="mx-auto w-[88svw] max-w-[1320px]">
      <div className="flex flex-col gap-12">
        {originals.map((item) => (
          <OriginalCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
