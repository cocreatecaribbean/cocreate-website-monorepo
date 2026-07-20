import type { ReactNode } from 'react'
import type { WorkProjectSection } from '@cocreate/types'
import ImpactCalloutBlock from '@/components/work/sections/impact-callout'
import MediaBannerBlock from '@/components/work/sections/media-banner'
import MediaPairBlock from '@/components/work/sections/media-pair'
import ProjectOverviewBlock from '@/components/work/sections/project-overview'
import SectionReveal from '@/components/work/sections/section-reveal'
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

  const wrap = (section: WorkProjectSection, node: ReactNode) => (
    <SectionReveal key={section._key} revealKey={section._key}>
      {node}
    </SectionReveal>
  )

  return (
    <div className="flex flex-col gap-24 md:gap-28 lg:gap-32">
      {sections.map((section) => {
        switch (section._type) {
          case 'projectOverview':
            return wrap(section, <ProjectOverviewBlock section={section} />)
          case 'mediaPair':
            return wrap(section, <MediaPairBlock section={section} />)
          case 'impactCallout':
            return wrap(section, <ImpactCalloutBlock section={section} />)
          case 'textAndMedia':
            return wrap(section, <TextAndMediaBlock section={section} />)
          case 'mediaBanner':
            return wrap(section, <MediaBannerBlock section={section} />)
          case 'shareBar':
            return wrap(
              section,
              <ShareBarBlock
                section={section}
                pageUrl={pageUrl}
                pageTitle={pageTitle}
              />,
            )
          default:
            return null
        }
      })}
    </div>
  )
}
