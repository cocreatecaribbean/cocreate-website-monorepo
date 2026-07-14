'use client'

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useIsPresentationTool, usePresentationQuery } from 'next-sanity/hooks'
import {
  mergeAboutPageContent,
  type AboutPageContent,
} from '@/lib/cms/about-page-content'
import {
  ABOUT_PRESENTATION_QUERY,
  type AboutPresentationResult,
} from '@/lib/sanity/about-presentation-query'

const AboutCmsContext = createContext<AboutPageContent | null>(null)

/** Stable identity — inline `{ query }` each render can retrigger the Presentation effect. */
const ABOUT_PRESENTATION_QUERY_OPTIONS = {
  query: ABOUT_PRESENTATION_QUERY,
}

type AboutCmsProviderProps = {
  initial: AboutPageContent
  children: ReactNode
}

export function AboutCmsProvider({ initial, children }: AboutCmsProviderProps) {
  const isPresentation = Boolean(useIsPresentationTool())
  const presentation = usePresentationQuery(ABOUT_PRESENTATION_QUERY_OPTIONS)

  const presentationData = presentation.data as AboutPresentationResult | undefined

  /** Value-stable snapshot so new object refs with identical data do not remount consumers. */
  const presentationSnapshot = useMemo(() => {
    if (presentationData == null) return null
    try {
      return JSON.stringify(presentationData)
    } catch {
      return null
    }
  }, [presentationData])

  const content = useMemo(() => {
    if (!isPresentation || presentationSnapshot == null) {
      return initial
    }
    const live = JSON.parse(presentationSnapshot) as AboutPresentationResult
    return mergeAboutPageContent(initial, live)
  }, [initial, isPresentation, presentationSnapshot])

  return (
    <AboutCmsContext.Provider value={content}>{children}</AboutCmsContext.Provider>
  )
}

export function useAboutPageContent(): AboutPageContent {
  const context = useContext(AboutCmsContext)
  if (!context) {
    throw new Error('useAboutPageContent must be used within AboutCmsProvider')
  }
  return context
}
