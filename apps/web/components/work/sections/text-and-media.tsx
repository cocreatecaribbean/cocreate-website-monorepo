import type { TextAndMediaSection } from '@cocreate/types'
import * as fonts from '@/styles/fonts'
import ProjectMediaFrame from '@/components/work/sections/project-media-frame'

export default function TextAndMediaBlock({
  section,
}: {
  section: TextAndMediaSection
}) {
  const mediaFirst = section.mediaPosition === 'left'

  const text = (
    <div
      className={`flex items-center text-left text-lg leading-relaxed text-slate-800 md:text-xl ${fonts.bricolage_grot400.className}`}
    >
      <p className="whitespace-pre-line">{section.body}</p>
    </div>
  )

  const media = (
    <ProjectMediaFrame
      media={section.media}
      showPlayOverlay
      className="relative aspect-video w-full overflow-hidden rounded-3xl sm:rounded-4xl"
      sizes="(max-width: 767px) 88vw, 42vw"
    />
  )

  return (
    <section className="grid items-center gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
      {mediaFirst ? (
        <>
          {media}
          {text}
        </>
      ) : (
        <>
          {text}
          {media}
        </>
      )}
    </section>
  )
}
