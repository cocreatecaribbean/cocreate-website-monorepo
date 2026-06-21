'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type {
  SocialListeningAnalyticsPayload,
  SocialListeningComparePayload,
} from './api-types'

export type ReportTemplateMeta = {
  id: string
  label: string
  description: string
  pageHint: string
  supportsCompare: boolean
}

export type CreateListeningSetupPayload = {
  keywords: { value: string; matchType: 'broad' | 'exact' }[]
  platforms: string[]
  startDate: string
  endDate: string
}

export type SocialListeningDataSource = {
  fetchAnalyticsWithStatus: (options?: {
    asOf?: string
  }) => Promise<
    | { status: 'ok'; payload: SocialListeningAnalyticsPayload }
    | { status: 'not_found' }
    | { status: 'error' }
  >
  fetchSnapshotDates: () => Promise<string[]>
  fetchCompare: (options: {
    baseline: string
    current?: string
  }) => Promise<SocialListeningComparePayload | null>
  fetchReportTemplates: () => Promise<ReportTemplateMeta[]>
  downloadReport: (options: {
    templateId: string
    asOf?: string
    baseline?: string
    current?: string
  }) => Promise<{ ok: true } | { ok: false; message: string }>
  createListeningSetup?: (
    payload: CreateListeningSetupPayload,
  ) => Promise<
    | {
        ok: true
        brand24ProjectId: string
        snapshotsCaptured: number
        startDate: string
        endDate: string
      }
    | { ok: false; message: string }
  >
}

const SocialListeningDataSourceContext =
  createContext<SocialListeningDataSource | null>(null)

export function SocialListeningDataSourceProvider({
  value,
  children,
}: {
  value: SocialListeningDataSource
  children: ReactNode
}) {
  return (
    <SocialListeningDataSourceContext.Provider value={value}>
      {children}
    </SocialListeningDataSourceContext.Provider>
  )
}

export function useSocialListeningDataSource(): SocialListeningDataSource {
  const value = useContext(SocialListeningDataSourceContext)
  if (!value) {
    throw new Error('SocialListeningDataSourceProvider is required')
  }
  return value
}
