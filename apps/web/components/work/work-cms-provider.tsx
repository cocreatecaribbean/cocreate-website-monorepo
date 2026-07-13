'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {useIsPresentationTool, usePresentationQuery} from 'next-sanity/hooks'
import type {ProjectPreview} from '@cocreate/types'
import {
  mergeWorkPageContent,
  type WorkPageContent,
} from '@/lib/cms/work-page-content'
import {
  cleanPresentationPage,
  mapPresentationProjects,
  WORK_PRESENTATION_QUERY,
  type WorkPresentationResult,
} from '@/lib/sanity/work-presentation-query'

type WorkCmsContextValue = {
  page: WorkPageContent
  /**
   * Live project tiles when Presentation / iframe refill has resolved.
   * `null` = use SSR items (outside Presentation, or handshake still pending).
   */
  projects: ProjectPreview[] | null
}

const WorkCmsContext = createContext<WorkCmsContextValue | null>(null)

function subscribeNoop() {
  return () => {}
}

function getIsPreviewIframe() {
  return typeof window !== 'undefined' && window.self !== window.top
}

type WorkCmsProviderProps = {
  initial: WorkPageContent
  /** SSR tiles — keep visible while live query catches up after soft history */
  initialProjects?: ProjectPreview[]
  children: ReactNode
}

export function WorkCmsProvider({
  initial,
  initialProjects = [],
  children,
}: WorkCmsProviderProps) {
  const isPresentationTool = Boolean(useIsPresentationTool())
  // Soft history can lag useIsPresentationTool; iframe check stays true in Presentation
  const isPreviewIframe = useSyncExternalStore(
    subscribeNoop,
    getIsPreviewIframe,
    () => false,
  )
  const inPresentation = isPresentationTool || isPreviewIframe

  const presentation = usePresentationQuery({
    query: WORK_PRESENTATION_QUERY,
  })

  const presentationData = presentation.data as
    | WorkPresentationResult
    | null
    | undefined

  const [refillProjects, setRefillProjects] = useState<ProjectPreview[] | null>(null)

  // Soft-back detail→/work: published SSR is empty; joh-style API refill in iframe only
  useEffect(() => {
    if (!isPreviewIframe) return
    if (initialProjects.length > 0) return
    if (
      presentationData != null &&
      Array.isArray(presentationData.projects) &&
      presentationData.projects.length > 0
    ) {
      return
    }

    let cancelled = false

    void fetch('/api/work/projects', {
      cache: 'no-store',
      headers: {'X-Preview-Context': 'embedded'},
    })
      .then(async (response) => {
        if (!response.ok) return null
        return response.json() as Promise<{projects?: ProjectPreview[]}>
      })
      .then((payload) => {
        if (cancelled || !payload?.projects) return
        setRefillProjects(payload.projects)
      })
      .catch(() => {
        // keep SSR / presentation path
      })

    return () => {
      cancelled = true
    }
  }, [initialProjects.length, isPreviewIframe, presentationData])

  const value = useMemo((): WorkCmsContextValue => {
    if (!inPresentation) {
      return {page: initial, projects: null}
    }

    // Prefer live Presentation query when it has a real projects array
    if (presentationData != null && Array.isArray(presentationData.projects)) {
      return {
        page: mergeWorkPageContent(initial, cleanPresentationPage(presentationData.page)),
        projects: mapPresentationProjects(presentationData.projects),
      }
    }

    if (presentationData != null) {
      return {
        page: mergeWorkPageContent(initial, cleanPresentationPage(presentationData.page)),
        projects: refillProjects,
      }
    }

    // Query still pending — use API refill if soft-back left SSR empty
    return {page: initial, projects: refillProjects}
  }, [initial, inPresentation, presentationData, refillProjects])

  return (
    <WorkCmsContext.Provider value={value}>{children}</WorkCmsContext.Provider>
  )
}

export function useWorkPageContent(): WorkPageContent {
  const context = useContext(WorkCmsContext)
  if (!context) {
    throw new Error('useWorkPageContent must be used within WorkCmsProvider')
  }
  return context.page
}

export function useWorkProjectsLive(): ProjectPreview[] | null {
  const context = useContext(WorkCmsContext)
  if (!context) {
    throw new Error('useWorkProjectsLive must be used within WorkCmsProvider')
  }
  return context.projects
}
