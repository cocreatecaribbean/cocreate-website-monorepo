import type { MediaBannerSection } from '@cocreate/types'
import ProjectMediaFrame from '@/components/work/sections/project-media-frame'

export default function MediaBannerBlock({
  section,
}: {
  section: MediaBannerSection
}) {
  return (
    <section>
      <ProjectMediaFrame
        media={section.media}
        showPlayOverlay
        className="relative aspect-[2/1] w-full overflow-hidden rounded-3xl sm:rounded-4xl min-[1024px]:rounded-[2rem]"
        sizes="(max-width: 1023px) 88vw, 1100px"
      />
    </section>
  )
}
