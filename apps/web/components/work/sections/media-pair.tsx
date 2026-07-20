import type { MediaPairSection } from '@cocreate/types'
import ProjectMediaFrame from '@/components/work/sections/project-media-frame'

export default function MediaPairBlock({ section }: { section: MediaPairSection }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 sm:gap-5">
      <ProjectMediaFrame
        media={section.left}
        showPlayOverlay
        className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl sm:rounded-4xl"
        sizes="(max-width: 639px) 88vw, 44vw"
      />
      <ProjectMediaFrame
        media={section.right}
        showPlayOverlay
        className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl sm:rounded-4xl"
        sizes="(max-width: 639px) 88vw, 44vw"
      />
    </section>
  )
}
