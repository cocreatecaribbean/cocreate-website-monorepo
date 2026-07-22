import type { MediaBannerSection } from '@cocreate/types'
import ProjectMediaFrame from '@/components/work/sections/project-media-frame'
import { workMediaFullBleedClass } from '@/components/work/sections/work-media-full-bleed'

export default function MediaBannerBlock({
  section,
}: {
  section: MediaBannerSection
}) {
  return (
    <section className={workMediaFullBleedClass}>
      <ProjectMediaFrame
        media={section.media}
        showPlayOverlay
        className="relative aspect-[8/3] w-full overflow-hidden"
        sizes="100vw"
      />
    </section>
  )
}
