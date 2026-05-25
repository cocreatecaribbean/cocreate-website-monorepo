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
import {
  adminFetchErrorHint,
  AdminApiFetchError,
  fetchAdminBff,
} from '@/lib/admin-api-fetch'

type AdminSession = {
  mode: 'user' | 'api_key'
  email: string | null
  status: string | null
}

type AdminSessionContextValue = {
  session: AdminSession | null
  loading: boolean
  error: string | null
  hint: string | null
  refresh: () => Promise<void>
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
        admin?: { email: string; status: string } | null
      }>('/api/session')

      if (data.mode === 'api_key') {
        setSession({ mode: 'api_key', email: null, status: null })
        return
      }

      if (data.admin?.email) {
        setSession({
          mode: 'user',
          email: data.admin.email,
          status: data.admin.status,
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

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo(
    () => ({ session, loading, error, hint, refresh }),
    [session, loading, error, hint, refresh],
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
