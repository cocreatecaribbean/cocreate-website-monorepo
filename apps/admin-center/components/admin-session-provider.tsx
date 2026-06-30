'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  adminFetchErrorHint,
  AdminApiFetchError,
  fetchAdminBff,
} from '@/lib/admin-api-fetch'
import type { AdminPortalRole } from '@/lib/admin-session'

type AdminSession = {
  mode: 'user' | 'api_key'
  userId: string | null
  email: string | null
  status: string | null
  role: AdminPortalRole | null
  displayName?: string | null
  profileComplete?: boolean
}

type AdminSessionContextValue = {
  session: AdminSession | null
  loading: boolean
  error: string | null
  hint: string | null
  refresh: () => Promise<void>
  clearQueryCache: () => void
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null)

export function useAdminSession() {
  const ctx = useContext(AdminSessionContext)
  if (!ctx) {
    throw new Error('useAdminSession must be used within AdminSessionProvider')
  }
  return ctx
}

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<AdminSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    setHint(null)

    try {
      const data = await fetchAdminBff<{
        ok?: boolean
        mode?: 'user' | 'api_key'
        admin?: {
          id: string
          email: string
          status: string
          role?: AdminPortalRole
          profile?: {
            displayName?: string | null
            profileComplete?: boolean
          }
        } | null
      }>('/api/session')

      if (data.mode === 'api_key') {
        setSession({ mode: 'api_key', userId: null, email: null, status: null, role: null })
        return
      }

      if (data.admin?.email) {
        setSession({
          mode: 'user',
          userId: data.admin.id,
          email: data.admin.email,
          status: data.admin.status,
          role: data.admin.role ?? 'ADMIN',
          displayName: data.admin.profile?.displayName ?? null,
          profileComplete: data.admin.profile?.profileComplete ?? false,
        })
        return
      }

      setSession(null)
      setError('Could not verify admin access.')
      setHint(adminFetchErrorHint('admin_required'))
    } catch (err) {
      setSession(null)
      if (err instanceof AdminApiFetchError) {
        setError(err.message)
        setHint(adminFetchErrorHint(err.code))
        // Middleware handles login redirects; avoid client-side redirect loops.
      } else {
        setError(err instanceof Error ? err.message : 'Could not verify admin session.')
        setHint(adminFetchErrorHint('unknown'))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const clearQueryCache = useCallback(() => {
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo(
    () => ({ session, loading, error, hint, refresh, clearQueryCache }),
    [session, loading, error, hint, refresh, clearQueryCache],
  )

  return (
    <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>
  )
}

export function AdminAccessBanner() {
  const { session, loading, error, hint } = useAdminSession()

  if (loading || (!error && session)) return null

  return (
    <div className="admin-alert-error mx-4 mb-4 mt-4 lg:mx-8 lg:mt-6" role="alert">
      <p className="font-medium">{error ?? 'Admin access could not be verified.'}</p>
      {hint ? <p className="mt-2 text-sm opacity-90">{hint}</p> : null}
      <p className="mt-2 text-sm">
        <a href="/login" className="underline underline-offset-2">
          Sign in again
        </a>
      </p>
    </div>
  )
}
