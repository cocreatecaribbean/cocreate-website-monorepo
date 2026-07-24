import Image from 'next/image'
import Link from 'next/link'
import type {
  OriginalArticleDetail,
  OriginalDetail,
  OriginalFilmDetail,
  OriginalPodcastDetail,
} from '@cocreate/types'
import type { PortableTextBlock } from '@portabletext/types'
import CaseStudyContent from '@/components/work/case-study-content'
import OriginalVideoPlayer from '@/components/originals/original-video-player'
import * as fonts from '@/styles/fonts'

type OriginalDetailViewProps = {
  original: OriginalDetail
}

function DetailHeader({ original }: { original: OriginalDetail }) {
  return (
    <header className="mx-auto mb-10 w-[88svw] max-w-[900px] min-[1024px]:mb-14">
      <Link
        href="/originals"
        className={`text-sm uppercase tracking-[0.12em] text-casablanca hover:text-chambray ${fonts.bricolage_grot400.className}`}
      >
        ← All originals
      </Link>
      <p
        className={`mt-6 text-xs uppercase tracking-[0.14em] text-casablanca ${fonts.bricolage_grot400.className}`}
      >
        {original.format ?? original.contentKind}
      </p>
      <h1
        className={`mt-3 text-4xl text-chambray min-[768px]:text-5xl ${fonts.bricolage_grot700.className}`}
      >
        {original.title}
      </h1>
      {original.description ? (
        <p
          className={`mt-5 text-lg text-slate-700 min-[1024px]:text-xl ${fonts.bricolage_grot400.className}`}
        >
          {original.description}
        </p>
      ) : null}
    </header>
  )
}

function Cover({ src, title }: { src: string; title: string }) {
  if (!src) return null
  return (
    <div className="relative mx-auto mb-10 aspect-[16/10] w-[88svw] max-w-[1100px] overflow-hidden rounded-3xl ring-1 ring-chambray/10 min-[1024px]:mb-14">
      <Image src={src} alt={title} fill sizes="1100px" className="object-cover" priority />
    </div>
  )
}

function FilmBody({ original }: { original: OriginalFilmDetail }) {
  return (
    <div className="mx-auto w-[88svw] max-w-[1100px] space-y-8">
      <OriginalVideoPlayer media={original.media} title={original.title} />
      {original.trailer?.youtubeVideoId || original.trailer?.playbackId ? (
        <div className="space-y-3">
          <h2 className={`text-xl text-chambray ${fonts.bricolage_grot600.className}`}>Trailer</h2>
          <OriginalVideoPlayer media={original.trailer} title={`${original.title} trailer`} />
        </div>
      ) : null}
    </div>
  )
}

function PodcastBody({ original }: { original: OriginalPodcastDetail }) {
  if (!original.episodes.length) {
    return (
      <p
        className={`mx-auto w-[88svw] max-w-[900px] text-lg text-slate-600 ${fonts.bricolage_grot400.className}`}
      >
        Episodes coming soon.
      </p>
    )
  }

  return (
    <div className="mx-auto flex w-[88svw] max-w-[1100px] flex-col gap-12">
      {original.episodes.map((episode) => (
        <article key={episode.id} className="grid gap-6 min-[900px]:grid-cols-[200px_1fr]">
          <div className="relative aspect-square overflow-hidden rounded-2xl ring-1 ring-chambray/10">
            {episode.thumbnailSrc || original.coverImageSrc ? (
              <Image
                src={episode.thumbnailSrc || original.coverImageSrc}
                alt=""
                fill
                sizes="200px"
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="space-y-4">
            <div>
              {typeof episode.episodeNumber === 'number' ? (
                <p
                  className={`text-xs uppercase tracking-[0.14em] text-casablanca ${fonts.bricolage_grot400.className}`}
                >
                  Episode {episode.episodeNumber}
                </p>
              ) : null}
              <h2 className={`mt-1 text-2xl text-chambray ${fonts.bricolage_grot600.className}`}>
                {episode.title}
              </h2>
              {episode.description ? (
                <p className={`mt-2 text-base text-slate-700 ${fonts.bricolage_grot400.className}`}>
                  {episode.description}
                </p>
              ) : null}
            </div>
            <OriginalVideoPlayer media={episode.media} title={episode.title} />
          </div>
        </article>
      ))}
    </div>
  )
}

function ArticleBody({ original }: { original: OriginalArticleDetail }) {
  return (
    <div className="mx-auto w-[88svw] max-w-[760px] space-y-14">
      {original.chapters.map((chapter) => (
        <section key={chapter._key}>
          <h2 className={`mb-5 text-2xl text-chambray ${fonts.bricolage_grot600.className}`}>
            {chapter.title}
          </h2>
          <CaseStudyContent value={chapter.body as PortableTextBlock[]} />
        </section>
      ))}
    </div>
  )
}

export default function OriginalDetailView({ original }: OriginalDetailViewProps) {
  return (
    <main className="min-h-svh overflow-x-clip pb-20 md:pb-28">
      <DetailHeader original={original} />
      <Cover src={original.coverImageSrc} title={original.title} />
      {original.contentKind === 'film' ? <FilmBody original={original} /> : null}
      {original.contentKind === 'podcastSeries' ? <PodcastBody original={original} /> : null}
      {original.contentKind === 'articleSeries' ? <ArticleBody original={original} /> : null}
    </main>
  )
}
