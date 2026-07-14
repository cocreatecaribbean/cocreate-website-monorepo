'use client'

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useIsPresentationTool, usePresentationQuery } from 'next-sanity/hooks'
import {
  mergeLandingPageContent,
  type LandingPageContent,
} from '@/lib/cms/landing-page-content'
import {
  LANDING_PRESENTATION_QUERY,
  type LandingPresentationResult,
} from '@/lib/sanity/landing-presentation-query'

const LandingCmsContext = createContext<LandingPageContent | null>(null)

/** Stable identity — inline `{ query }` each render can retrigger the Presentation effect. */
const LANDING_PRESENTATION_QUERY_OPTIONS = {
  query: LANDING_PRESENTATION_QUERY,
}

type LandingCmsProviderProps = {
  initial: LandingPageContent
  children: ReactNode
}

export function LandingCmsProvider({ initial, children }: LandingCmsProviderProps) {
  const isPresentation = Boolean(useIsPresentationTool())
  const presentation = usePresentationQuery(LANDING_PRESENTATION_QUERY_OPTIONS)

  const presentationData = presentation.data as LandingPresentationResult | undefined

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
    const live = JSON.parse(presentationSnapshot) as LandingPresentationResult
    return mergeLandingPageContent(initial, live)
  }, [initial, isPresentation, presentationSnapshot])

  return (
    <LandingCmsContext.Provider value={content}>{children}</LandingCmsContext.Provider>
  )
}

export function useLandingPageContent(): LandingPageContent {
  const context = useContext(LandingCmsContext)
  if (!context) {
    throw new Error('useLandingPageContent must be used within LandingCmsProvider')
  }
  return context
}
