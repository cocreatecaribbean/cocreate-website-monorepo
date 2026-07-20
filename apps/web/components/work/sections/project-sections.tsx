import type { WorkProjectSection } from '@cocreate/types'
import ImpactCalloutBlock from '@/components/work/sections/impact-callout'
import MediaBannerBlock from '@/components/work/sections/media-banner'
import MediaPairBlock from '@/components/work/sections/media-pair'
import ProjectOverviewBlock from '@/components/work/sections/project-overview'
import ShareBarBlock from '@/components/work/sections/share-bar'
import TextAndMediaBlock from '@/components/work/sections/text-and-media'

type ProjectSectionsProps = {
  sections: WorkProjectSection[]
  pageUrl: string
  pageTitle: string
}

export default function ProjectSections({
  sections,
  pageUrl,
  pageTitle,
}: ProjectSectionsProps) {
  if (!sections.length) return null

  return (
    <div className="flex flex-col gap-24 md:gap-28 lg:gap-32">
      {sections.map((section) => {
        switch (section._type) {
          case 'projectOverview':
            return <ProjectOverviewBlock key={section._key} section={section} />
          case 'mediaPair':
            return <MediaPairBlock key={section._key} section={section} />
          case 'impactCallout':
            return <ImpactCalloutBlock key={section._key} section={section} />
          case 'textAndMedia':
            return <TextAndMediaBlock key={section._key} section={section} />
          case 'mediaBanner':
            return <MediaBannerBlock key={section._key} section={section} />
          case 'shareBar':
            return (
              <ShareBarBlock
                key={section._key}
                section={section}
                pageUrl={pageUrl}
                pageTitle={pageTitle}
              />
            )
          default:
            return null
        }
      })}
    </div>
  )
}
