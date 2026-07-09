'use client'

import {
  createContext,
  useContext,
  type ReactNode,
} from 'react'
import type { SocialListeningSnapshotDatesResult } from './snapshot-dates'

export type SnapshotDatesContextValue = {
  snapshots: SocialListeningSnapshotDatesResult['snapshots']
  dates: string[]
  organizationName: string | null
  loading: boolean
  refresh: () => Promise<void>
}

const SnapshotDatesContext = createContext<SnapshotDatesContextValue | null>(null)

export function SnapshotDatesProvider({
  value,
  children,
}: {
  value: SnapshotDatesContextValue
  children: ReactNode
}) {
  return (
    <SnapshotDatesContext.Provider value={value}>
      {children}
    </SnapshotDatesContext.Provider>
  )
}

export function useSnapshotDates(): SnapshotDatesContextValue {
  const value = useContext(SnapshotDatesContext)
  if (!value) {
    throw new Error('SnapshotDatesProvider is required')
  }
  return value
}
