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

type LandingCmsProviderProps = {
  initial: LandingPageContent
  children: ReactNode
}

export function LandingCmsProvider({ initial, children }: LandingCmsProviderProps) {
  const isPresentation = Boolean(useIsPresentationTool())
  const presentation = usePresentationQuery({
    query: LANDING_PRESENTATION_QUERY,
  })

  const presentationData = presentation.data as LandingPresentationResult | undefined

  const content = useMemo(() => {
    if (!isPresentation || presentationData == null) {
      return initial
    }
    return mergeLandingPageContent(initial, presentationData)
  }, [initial, isPresentation, presentationData])

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
