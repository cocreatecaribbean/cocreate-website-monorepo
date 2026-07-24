import type { Metadata } from 'next'
import OriginalsPageHeader from '@/components/originals/originals-page-header'
import OriginalCard from '@/components/originals/original-card'
import { fetchOriginalPreviews } from '@/lib/cms/originals'

export const metadata: Metadata = {
  title: 'Originals | CoCreate Caribbean',
  description: 'CoCreate studio-led originals — film, series, and culture from the Caribbean.',
}

export default async function OriginalsPage() {
  const originals = await fetchOriginalPreviews()

  return (
    <main className="min-h-svh overflow-x-clip pb-20 md:pb-28">
      <OriginalsPageHeader />
      {originals.length > 0 ? (
        <section className="mx-auto w-[88svw] max-w-[1320px]">
          <div className="grid gap-12 md:grid-cols-2">
            {originals.map((item) => (
              <OriginalCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
