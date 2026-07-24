'use client'

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useIsPresentationTool, usePresentationQuery } from 'next-sanity/hooks'
import type { ProjectPreview } from '@cocreate/types'
import { selectHomeGalleryPreviews } from '@/lib/cms/home-gallery-select'
import { HOME_GALLERY_PREVIEW_COUNT } from '@/site-info/home-gallery-config'
import {
  WORK_PRESENTATION_QUERY,
  mapPresentationHomeProjects,
  type WorkPresentationResult,
} from '@/lib/sanity/work-presentation-query'

const HomeGalleryCmsContext = createContext<ProjectPreview[] | null>(null)

const HOME_GALLERY_PRESENTATION_QUERY_OPTIONS = {
  query: WORK_PRESENTATION_QUERY,
}

type HomeGalleryCmsProviderProps = {
  initial: ProjectPreview[]
  children: ReactNode
}

/**
 * Presentation: live Work projects → featured-first home gallery.
 * Outside Presentation: SSR `initial` only (anonymous ISR).
 */
export function HomeGalleryCmsProvider({
  initial,
  children,
}: HomeGalleryCmsProviderProps) {
  const isPresentation = Boolean(useIsPresentationTool())
  const presentation = usePresentationQuery(HOME_GALLERY_PRESENTATION_QUERY_OPTIONS)

  const presentationData = presentation.data as WorkPresentationResult | undefined

  const presentationSnapshot = useMemo(() => {
    if (presentationData?.projects == null) return null
    try {
      return JSON.stringify(presentationData.projects)
    } catch {
      return null
    }
  }, [presentationData?.projects])

  const items = useMemo(() => {
    if (!isPresentation || presentationSnapshot == null) {
      return initial
    }
    const rows = JSON.parse(presentationSnapshot) as NonNullable<
      WorkPresentationResult['projects']
    >
    const mapped = mapPresentationHomeProjects(rows).filter((project) =>
      Boolean(project.coverImageSrc?.trim()),
    )
    return selectHomeGalleryPreviews(mapped, HOME_GALLERY_PREVIEW_COUNT)
  }, [initial, isPresentation, presentationSnapshot])

  return (
    <HomeGalleryCmsContext.Provider value={items}>
      {children}
    </HomeGalleryCmsContext.Provider>
  )
}

export function useHomeGalleryItems(): ProjectPreview[] {
  const context = useContext(HomeGalleryCmsContext)
  if (!context) {
    throw new Error('useHomeGalleryItems must be used within HomeGalleryCmsProvider')
  }
  return context
}
