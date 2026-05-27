import Image from 'next/image'
import type { Metadata } from 'next'
import * as fonts from '@/styles/fonts'
import { fetchOriginalPreviews } from '@/lib/cms/originals'
import YouTubeEmbed from '@/components/media/youtube-embed'

export const metadata: Metadata = {
  title: 'Originals | CoCreate Caribbean',
  description: 'CoCreate studio-led originals — film, series, and culture from the Caribbean.',
}

export default async function OriginalsPage() {
  const originals = await fetchOriginalPreviews()

  return (
    <main className="min-h-svh pb-20 md:pb-28">
      <section className="mx-auto w-[88svw] max-w-[1320px] pt-32">
        <h1
          className={`mb-12 text-[clamp(2.5rem,5vw,4.5rem)] uppercase text-sanmarino ${fonts.bricolage_grot700.className}`}
        >
          Originals
        </h1>

        <div className="grid gap-12 md:grid-cols-2">
          {originals.map((item) => (
            <article key={item.id} className="space-y-5">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-chambray/10">
                <Image
                  src={item.coverImageSrc}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 88vw, 640px"
                  className="object-cover"
                />
              </div>
              <div>
                <p
                  className={`text-xs uppercase tracking-[0.14em] text-casablanca ${fonts.bricolage_grot400.className}`}
                >
                  {item.format ?? 'Original'}
                </p>
                <h2
                  className={`mt-2 text-2xl text-chambray ${fonts.bricolage_grot600.className}`}
                >
                  {item.title}
                </h2>
                {item.description ? (
                  <p
                    className={`mt-3 text-lg text-slate-700 ${fonts.bricolage_grot400.className}`}
                  >
                    {item.description}
                  </p>
                ) : null}
              </div>
              {item.youtubeVideoId ? (
                <YouTubeEmbed videoId={item.youtubeVideoId} title={item.title} />
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
