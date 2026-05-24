'use client'

import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import ClientPortalLoginOverlay from '@/components/client-portal/client-portal-login-overlay'
import { clientPortalQueryParam } from '@/site-info/global-site-info'

type ClientPortalContextValue = {
  isOpen: boolean
  openClientPortalLogin: () => void
  closeClientPortalLogin: () => void
}

const ClientPortalContext = createContext<ClientPortalContextValue | null>(null)

function readClientPortalOpen() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has(clientPortalQueryParam)
}

function ClientPortalQuerySync({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void
}) {
  const searchParams = useSearchParams()

  useEffect(() => {
    onOpenChange(searchParams.has(clientPortalQueryParam))
  }, [searchParams, onOpenChange])

  return null
}

export function ClientPortalProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const openClientPortalLogin = useCallback(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    )
    params.set(clientPortalQueryParam, '')
    const query = params.toString()
    router.push(`${pathname}?${query}`, { scroll: false })
  }, [pathname, router])

  const closeClientPortalLogin = useCallback(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    )
    if (!params.has(clientPortalQueryParam)) return
    params.delete(clientPortalQueryParam)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router])

  useEffect(() => {
    setIsOpen(readClientPortalOpen())
  }, [pathname])

  const value = useMemo(
    () => ({ isOpen, openClientPortalLogin, closeClientPortalLogin }),
    [isOpen, openClientPortalLogin, closeClientPortalLogin],
  )

  return (
    <ClientPortalContext.Provider value={value}>
      {children}
      <Suspense fallback={null}>
        <ClientPortalQuerySync onOpenChange={setIsOpen} />
      </Suspense>
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
