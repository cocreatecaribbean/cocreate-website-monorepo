import type { Metadata } from 'next'
import OriginalsPageHeader from '@/components/originals/originals-page-header'
import { OriginalsCmsProvider } from '@/components/originals/originals-cms-provider'
import OriginalsGridLive from '@/components/originals/originals-grid-live'
import { fetchOriginalPreviews } from '@/lib/cms/originals'
import { getSanityPreviewContext } from '@/lib/preview-context'

export const metadata: Metadata = {
  title: 'Originals | CoCreate Caribbean',
  description: 'CoCreate studio-led originals — film, series, and culture from the Caribbean.',
}

export default async function OriginalsPage() {
  const preview = await getSanityPreviewContext()
  const originals = await fetchOriginalPreviews(preview)

  return (
    <main className="min-h-svh overflow-x-clip">
      <OriginalsPageHeader />
      <OriginalsCmsProvider initial={originals}>
        <OriginalsGridLive />
      </OriginalsCmsProvider>
    </main>
  )
}
