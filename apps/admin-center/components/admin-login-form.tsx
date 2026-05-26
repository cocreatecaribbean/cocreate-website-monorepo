'use client'

import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import CoCreateLogo from '@/components/cocreate-logo'
import DevSignInLink from '@/components/dev-sign-in-link'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { alkatra600, bricolage_grot500 } from '@/styles/fonts'

const apiBase = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export default function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'
  const errorCode = searchParams.get('error')
  const authError = errorCode === 'auth'
  const sessionExpired = errorCode === 'session_expired'
  const adminRequired = errorCode === 'admin_required'
  const adminSuspended = errorCode === 'admin_suspended'
  const showSignOut =
    adminRequired || adminSuspended || sessionExpired || errorCode === 'auth'
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [devSignInUrl, setDevSignInUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setMessage(null)
    setDevSignInUrl(null)

    try {
      const response = await fetch(`${apiBase()}/auth/admin/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = (await response.json()) as {
        ok?: boolean
        message?: string
        devSignInUrl?: string
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? 'Unable to send sign-in link')
      }

      setMessage(data.message ?? 'Check your email for a sign-in link.')
      if (data.devSignInUrl) {
        setDevSignInUrl(data.devSignInUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <div className="admin-glass-card w-full max-w-md p-8 sm:p-10">
        <CoCreateLogo href="/" className="h-9 w-auto" priority />
        <p className="admin-eyebrow mt-8">CoCreate Control Center</p>
        <h1 className={`mt-2 text-2xl text-chambray sm:text-3xl ${alkatra600.className}`}>
          Admin sign in
        </h1>
        <p className={`mt-2 text-sm leading-relaxed text-app-muted ${bricolage_grot500.className}`}>
          Enter your agency admin email. We&apos;ll send a secure magic link.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@cocreate.com"
            className="admin-input w-full"
          />
          <button type="submit" disabled={submitting} className="admin-btn-primary w-full">
            {submitting ? 'Sending link…' : 'Email me a sign-in link'}
          </button>
        </form>

        {authError && !message ? (
          <p className="admin-alert-warn mt-4">
            That sign-in link expired or was already used. Request a new link below.
          </p>
        ) : null}
        {sessionExpired && !message ? (
          <p className="admin-alert-warn mt-4">
            Your session expired. Request a new magic link below.
          </p>
        ) : null}
        {adminRequired && !message ? (
          <p className="admin-alert-warn mt-4">
            This signed-in account is not on the agency admin roster. Use an email from{' '}
            <code className="rounded bg-chambray/5 px-1 text-xs">seed:admin</code> or Team
            invite, then sign in again.
          </p>
        ) : null}
        {adminSuspended && !message ? (
          <p className="admin-alert-warn mt-4">
            This admin account is suspended. Contact another agency admin to restore access.
          </p>
        ) : null}
        {showSignOut ? (
          <button
            type="button"
            className="admin-btn-ghost mt-4 w-full"
            onClick={async () => {
              const supabase = createSupabaseBrowserClient()
              await supabase.auth.signOut()
              router.replace('/login')
              router.refresh()
            }}
          >
            Sign out and use a different email
          </button>
        ) : null}
        {message ? <p className="admin-alert-success mt-4">{message}</p> : null}
        {devSignInUrl ? <DevSignInLink url={devSignInUrl} /> : null}
        {error ? <p className="admin-alert-error mt-4">{error}</p> : null}

        <p className="mt-6 text-xs text-app-muted">
          After signing in you&apos;ll return to {next === '/' ? 'the dashboard' : next}.
        </p>
      </div>
    </main>
  )
}
