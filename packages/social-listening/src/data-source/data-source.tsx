'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type {
  SocialListeningAnalyticsPayload,
  SocialListeningComparePayload,
  SocialListeningReportTemplateMeta,
} from '@cocreate/api-contracts/v1/social-listening'
import type { CreateListeningSetupPayload } from '@cocreate/api-contracts/v1/requests/social-listening'

export type { SocialListeningReportTemplateMeta as ReportTemplateMeta }
export type { CreateListeningSetupPayload }

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
  fetchReportTemplates: () => Promise<SocialListeningReportTemplateMeta[]>
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
