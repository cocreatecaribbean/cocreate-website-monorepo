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
import PodcastEpisodePlayer from '@/components/originals/podcast-episode-player'
import { pageNavClearanceClass } from '@/lib/page-layout'
import * as fonts from '@/styles/fonts'

type OriginalDetailViewProps = {
  original: OriginalDetail
}

function BackLink() {
  return (
    <Link
      href="/originals"
      className={`text-sm uppercase tracking-[0.12em] text-casablanca hover:text-chambray ${fonts.bricolage_grot400.className}`}
    >
      ← All originals
    </Link>
  )
}

function PodcastHeader({ original }: { original: OriginalPodcastDetail }) {
  return (
    <header
      className={`mx-auto mb-10 flex w-[88svw] max-w-[900px] flex-col items-center min-[1024px]:mb-14 ${pageNavClearanceClass}`}
    >
      <div className="mb-8 self-start">
        <BackLink />
      </div>
      {original.logoSrc ? (
        <div className="relative h-40 w-full max-w-[280px] min-[768px]:h-52 min-[768px]:max-w-[340px]">
          <Image
            src={original.logoSrc}
            alt={original.title}
            fill
            sizes="340px"
            className="object-contain"
            priority
          />
        </div>
      ) : (
        <h1
          className={`text-center text-4xl text-chambray min-[768px]:text-5xl ${fonts.bricolage_grot700.className}`}
        >
          {original.title}
        </h1>
      )}
    </header>
  )
}

function StandardHeader({ original }: { original: OriginalDetail }) {
  return (
    <header
      className={`mx-auto mb-10 w-[88svw] max-w-[900px] min-[1024px]:mb-14 ${pageNavClearanceClass}`}
    >
      <BackLink />
      {original.logoSrc ? (
        <div className="relative mx-auto mt-8 h-28 w-full max-w-[220px]">
          <Image
            src={original.logoSrc}
            alt={original.title}
            fill
            sizes="220px"
            className="object-contain"
          />
        </div>
      ) : null}
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
  if (original.contentKind === 'podcastSeries') {
    return (
      <main className="min-h-svh overflow-x-clip pb-16">
        <PodcastHeader original={original} />
        <PodcastEpisodePlayer original={original} />
      </main>
    )
  }

  return (
    <main className="min-h-svh overflow-x-clip">
      <StandardHeader original={original} />
      <Cover src={original.coverImageSrc} title={original.title} />
      {original.contentKind === 'film' ? <FilmBody original={original} /> : null}
      {original.contentKind === 'articleSeries' ? <ArticleBody original={original} /> : null}
    </main>
  )
}
