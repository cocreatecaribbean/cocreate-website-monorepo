'use client'

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { useIsPresentationTool, usePresentationQuery } from 'next-sanity/hooks'
import type { WorkProjectDetail } from '@cocreate/types'
import {
  mapPresentationWorkProject,
  WORK_PROJECT_PRESENTATION_QUERY,
  type WorkProjectPresentationRow,
} from '@/lib/sanity/work-project-presentation-query'

const WorkProjectCmsContext = createContext<WorkProjectDetail | null>(null)

function subscribeNoop() {
  return () => {}
}

function getIsPreviewIframe() {
  return typeof window !== 'undefined' && window.self !== window.top
}

type WorkProjectCmsProviderProps = {
  initial: WorkProjectDetail
  slug: string
  children: ReactNode
}

export function WorkProjectCmsProvider({
  initial,
  slug,
  children,
}: WorkProjectCmsProviderProps) {
  const isPresentationTool = Boolean(useIsPresentationTool())
  const isPreviewIframe = useSyncExternalStore(
    subscribeNoop,
    getIsPreviewIframe,
    () => false,
  )
  const inPresentation = isPresentationTool || isPreviewIframe

  const slugKey = slug.trim().toLowerCase()

  const queryOptions = useMemo(
    () => ({
      query: WORK_PROJECT_PRESENTATION_QUERY,
      params: { slug: slugKey },
    }),
    [slugKey],
  )

  const presentation = usePresentationQuery(queryOptions)

  const presentationData = presentation.data as
    | WorkProjectPresentationRow
    | null
    | undefined

  const presentationSnapshot = useMemo(() => {
    if (presentationData == null) return null
    try {
      return JSON.stringify(presentationData)
    } catch {
      return null
    }
  }, [presentationData])

  const project = useMemo(() => {
    if (!inPresentation || presentationSnapshot == null) {
      return initial
    }
    const live = JSON.parse(presentationSnapshot) as WorkProjectPresentationRow
    return mapPresentationWorkProject(live) ?? initial
  }, [initial, inPresentation, presentationSnapshot])

  return (
    <WorkProjectCmsContext.Provider value={project}>
      {children}
    </WorkProjectCmsContext.Provider>
  )
}

export function useWorkProjectLive(): WorkProjectDetail {
  const context = useContext(WorkProjectCmsContext)
  if (!context) {
    throw new Error('useWorkProjectLive must be used within WorkProjectCmsProvider')
  }
  return context
}
