import Image from 'next/image'
import type { WorkProjectDetail } from '@cocreate/types'
import * as fonts from '@/styles/fonts'
import { workClientFilterHref } from '@/lib/client-slug'
import { workPageTopOffsetClass } from '@/lib/work-page-layout'
import ViewAllWorkLink from '@/components/work/view-all-work-link'
import CoCreateButton from '@/components/ui/cocreate-button'
import CaseStudyContent from '@/components/work/case-study-content'
import MuxVideoPlayer, {
  projectVideoLabel,
} from '@/components/media/mux-video-player'

type WorkProjectPageProps = {
  project: WorkProjectDetail
}

export default function WorkProjectPage({ project }: WorkProjectPageProps) {
  const clientHref = workClientFilterHref(project.clientSlug!)
  const primaryVideo =
    project.videos?.find((video) => video.role === 'final_ad') ?? project.videos?.[0]
  const secondaryVideos =
    project.videos?.filter((video) => video.playbackId !== primaryVideo?.playbackId) ?? []

  return (
    <main className="min-h-svh pb-20 md:pb-28">
      <article
        className={`mx-auto w-[88svw] max-w-[1320px] ${workPageTopOffsetClass}`}
      >
        <div className="flex flex-col gap-10 min-[1024px]:flex-row min-[1024px]:items-start min-[1024px]:gap-14 min-[1500px]:gap-20">
          <header className="min-w-0 max-w-full min-[1024px]:sticky min-[1024px]:top-32 min-[1024px]:w-[min(360px,36%)] min-[1024px]:max-w-[36%] min-[1024px]:shrink-0">
            <p
              className={`mb-3 text-xs uppercase tracking-[0.16em] text-casablanca min-[1024px]:mb-4 min-[1024px]:text-sm ${fonts.bricolage_grot500.className}`}
            >
              {project.category}
            </p>
            <h1
              className={`
                max-w-full text-balance break-words text-left uppercase
                leading-[1.05] text-sanmarino
                text-[clamp(2rem,6.5vw,3.25rem)]
                min-[1024px]:text-[clamp(1.65rem,2.4vw,2.75rem)]
                min-[1280px]:text-[clamp(1.85rem,2.2vw,3rem)]
                ${fonts.bricolage_grot800.className}
              `}
            >
              <span className="bg-linear-to-br from-sanmarino via-chambray to-casablanca bg-clip-text text-transparent">
                {project.projectName}
              </span>
            </h1>
            <p
              className={`mt-5 max-w-full text-left text-[clamp(1.25rem,3vw,1.75rem)] text-chambray min-[1024px]:mt-6 ${fonts.alkatra400.className}`}
            >
              <a
                href={clientHref}
                className="transition-opacity hover:text-sanmarino"
              >
                {project.clientName}
              </a>
            </p>
            <ViewAllWorkLink className="mt-6 min-[1024px]:mt-8" />
          </header>

          <div className="min-w-0 flex-1">
            {primaryVideo ? (
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-4xl ring-1 ring-chambray/10 min-[1024px]:rounded-[2rem]">
                <MuxVideoPlayer
                  playbackId={primaryVideo.playbackId}
                  title={projectVideoLabel(primaryVideo.role, primaryVideo.title)}
                  poster={primaryVideo.posterUrl ?? project.coverImageSrc}
                  className="h-full w-full"
                />
              </div>
            ) : (
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-4xl ring-1 ring-chambray/10 min-[1024px]:aspect-[16/10] min-[1024px]:rounded-[2rem]">
                <Image
                  src={project.coverImageSrc}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1023px) 88vw, 900px"
                  className="object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-chambray/50 via-transparent to-transparent" />
              </div>
            )}

            <div
              className={`mt-8 max-w-2xl text-lg leading-relaxed text-slate-800 min-[1024px]:mt-10 min-[1024px]:text-xl ${fonts.bricolage_grot400.className}`}
            >
              <p>{project.summary}</p>
              {project.caseStudy?.length ? (
                <div className="mt-8">
                  <CaseStudyContent
                    value={project.caseStudy as import('@portabletext/types').PortableTextBlock[]}
                  />
                </div>
              ) : null}
            </div>

            {secondaryVideos.length > 0 ? (
              <div className="mt-12 space-y-10">
                {secondaryVideos.map((video) => (
                  <section key={`${video.role}-${video.playbackId}`}>
                    <h2
                      className={`mb-4 text-xl text-sanmarino ${fonts.bricolage_grot600.className}`}
                    >
                      {projectVideoLabel(video.role, video.title)}
                    </h2>
                    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl ring-1 ring-chambray/10">
                      <MuxVideoPlayer
                        playbackId={video.playbackId}
                        title={projectVideoLabel(video.role, video.title)}
                        poster={video.posterUrl ?? project.coverImageSrc}
                        className="h-full w-full"
                      />
                    </div>
                  </section>
                ))}
              </div>
            ) : null}

            {project.gallery && project.gallery.length > 0 ? (
              <div className="mt-12 grid gap-6 sm:grid-cols-2">
                {project.gallery.map((item, index) => (
                  <figure
                    key={`${item.src}-${index}`}
                    className="overflow-hidden rounded-2xl ring-1 ring-chambray/10"
                  >
                    <div className="relative aspect-[4/5] w-full">
                      <Image
                        src={item.src}
                        alt={item.alt ?? ''}
                        fill
                        sizes="(max-width: 767px) 88vw, 440px"
                        className="object-cover"
                      />
                    </div>
                    {item.caption ? (
                      <figcaption
                        className={`px-4 py-3 text-sm text-slate-600 ${fonts.bricolage_grot400.className}`}
                      >
                        {item.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            ) : null}

            <div className="mt-10">
              <CoCreateButton href={clientHref} size="md">
                More from {project.clientName}
              </CoCreateButton>
            </div>
          </div>
        </div>
      </article>
    </main>
  )
}
