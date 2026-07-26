'use client'

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { useIsPresentationTool, usePresentationQuery } from 'next-sanity/hooks'
import type { OriginalPreview } from '@cocreate/types'
import {
  ORIGINALS_PRESENTATION_QUERY,
  mapPresentationOriginalPreviews,
  type OriginalPresentationIndexRow,
} from '@/lib/sanity/originals-presentation-query'

const OriginalsCmsContext = createContext<OriginalPreview[] | null>(null)

const ORIGINALS_PRESENTATION_QUERY_OPTIONS = {
  query: ORIGINALS_PRESENTATION_QUERY,
}

function subscribeNoop() {
  return () => {}
}

function getIsPreviewIframe() {
  return typeof window !== 'undefined' && window.self !== window.top
}

type OriginalsCmsProviderProps = {
  initial: OriginalPreview[]
  children: ReactNode
}

/**
 * Presentation: live Originals index (drafts included).
 * Outside Presentation: SSR `initial` only.
 */
export function OriginalsCmsProvider({
  initial,
  children,
}: OriginalsCmsProviderProps) {
  const isPresentationTool = Boolean(useIsPresentationTool())
  const isPreviewIframe = useSyncExternalStore(
    subscribeNoop,
    getIsPreviewIframe,
    () => false,
  )
  const inPresentation = isPresentationTool || isPreviewIframe

  const presentation = usePresentationQuery(ORIGINALS_PRESENTATION_QUERY_OPTIONS)

  const presentationData = presentation.data as
    | OriginalPresentationIndexRow[]
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

  const items = useMemo(() => {
    if (!inPresentation || presentationSnapshot == null) {
      return initial
    }
    const rows = JSON.parse(presentationSnapshot) as OriginalPresentationIndexRow[]
    return mapPresentationOriginalPreviews(rows)
  }, [initial, inPresentation, presentationSnapshot])

  return (
    <OriginalsCmsContext.Provider value={items}>{children}</OriginalsCmsContext.Provider>
  )
}

export function useOriginalsLive(): OriginalPreview[] {
  const context = useContext(OriginalsCmsContext)
  if (!context) {
    throw new Error('useOriginalsLive must be used within OriginalsCmsProvider')
  }
  return context
}
