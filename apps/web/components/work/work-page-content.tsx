'use client'

import './work-tiles.css'
import { useRef } from 'react'
import { useWorkPageAnimation } from '@/hooks/use-work-page-animation'
import WorkMasonryGrid from '@/components/work/work-masonry-grid'
import WorkPageHeader from '@/components/work/work-page-header'

export default function WorkPageContent() {
  const sectionRef = useRef<HTMLElement>(null)
  useWorkPageAnimation({ scope: sectionRef })

  return (
    <section ref={sectionRef} className="work-page-content">
      <WorkPageHeader />
      <WorkMasonryGrid />
    </section>
  )
}
