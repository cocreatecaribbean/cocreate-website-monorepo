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

type AboutCmsProviderProps = {
  initial: AboutPageContent
  children: ReactNode
}

export function AboutCmsProvider({ initial, children }: AboutCmsProviderProps) {
  const isPresentation = Boolean(useIsPresentationTool())
  const presentation = usePresentationQuery({
    query: ABOUT_PRESENTATION_QUERY,
  })

  const presentationData = presentation.data as AboutPresentationResult | undefined

  const content = useMemo(() => {
    if (!isPresentation || presentationData == null) {
      return initial
    }
    return mergeAboutPageContent(initial, presentationData)
  }, [initial, isPresentation, presentationData])

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
