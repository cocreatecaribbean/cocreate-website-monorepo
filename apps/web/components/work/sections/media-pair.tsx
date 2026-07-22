import type { MediaPairSection } from '@cocreate/types'
import ProjectMediaFrame from '@/components/work/sections/project-media-frame'
import { workMediaFullBleedClass } from '@/components/work/sections/work-media-full-bleed'

export default function MediaPairBlock({ section }: { section: MediaPairSection }) {
  return (
    <section className={`${workMediaFullBleedClass} grid gap-1 sm:grid-cols-2 sm:gap-2`}>
      <ProjectMediaFrame
        media={section.left}
        showPlayOverlay
        className="relative aspect-[4/3] w-full overflow-hidden"
        sizes="(max-width: 639px) 100vw, 50vw"
      />
      <ProjectMediaFrame
        media={section.right}
        showPlayOverlay
        className="relative aspect-[4/3] w-full overflow-hidden"
        sizes="(max-width: 639px) 100vw, 50vw"
      />
    </section>
  )
}
