'use client'

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { useIsPresentationTool, usePresentationQuery } from 'next-sanity/hooks'
import type { OriginalDetail } from '@cocreate/types'
import {
  ORIGINAL_BY_SLUG_PRESENTATION_QUERY,
  mapPresentationOriginalDetail,
} from '@/lib/sanity/originals-presentation-query'

const OriginalCmsContext = createContext<OriginalDetail | null>(null)

function subscribeNoop() {
  return () => {}
}

function getIsPreviewIframe() {
  return typeof window !== 'undefined' && window.self !== window.top
}

type OriginalCmsProviderProps = {
  initial: OriginalDetail | null
  slug: string
  children: ReactNode
}

/**
 * Presentation: live original detail (drafts / synced episodes).
 * Outside Presentation: SSR `initial` only.
 */
export function OriginalCmsProvider({
  initial,
  slug,
  children,
}: OriginalCmsProviderProps) {
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
      query: ORIGINAL_BY_SLUG_PRESENTATION_QUERY,
      params: { slug: slugKey },
    }),
    [slugKey],
  )

  const presentation = usePresentationQuery(queryOptions)

  const presentationData = presentation.data as Record<string, unknown> | null | undefined

  const presentationSnapshot = useMemo(() => {
    if (presentationData == null) return null
    try {
      return JSON.stringify(presentationData)
    } catch {
      return null
    }
  }, [presentationData])

  const original = useMemo(() => {
    if (!inPresentation || presentationSnapshot == null) {
      return initial
    }
    const live = JSON.parse(presentationSnapshot) as Record<string, unknown>
    return mapPresentationOriginalDetail(live) ?? initial
  }, [initial, inPresentation, presentationSnapshot])

  return (
    <OriginalCmsContext.Provider value={original}>{children}</OriginalCmsContext.Provider>
  )
}

/** Null while draft soft-miss waits for Presentation query. */
export function useOriginalLive(): OriginalDetail | null {
  return useContext(OriginalCmsContext)
}
