'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import ClientPortalLoginOverlay from '@/components/client-portal/client-portal-login-overlay'

type ClientPortalContextValue = {
  isOpen: boolean
  openClientPortalLogin: () => void
  closeClientPortalLogin: () => void
}

const ClientPortalContext = createContext<ClientPortalContextValue | null>(null)

export function ClientPortalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openClientPortalLogin = useCallback(() => setIsOpen(true), [])
  const closeClientPortalLogin = useCallback(() => setIsOpen(false), [])

  const value = useMemo(
    () => ({ isOpen, openClientPortalLogin, closeClientPortalLogin }),
    [isOpen, openClientPortalLogin, closeClientPortalLogin],
  )

  return (
    <ClientPortalContext.Provider value={value}>
      {children}
      <ClientPortalLoginOverlay />
    </ClientPortalContext.Provider>
  )
}

export function useClientPortalLogin() {
  const context = useContext(ClientPortalContext)
  if (!context) {
    throw new Error('useClientPortalLogin must be used within ClientPortalProvider')
  }
  return context
}
