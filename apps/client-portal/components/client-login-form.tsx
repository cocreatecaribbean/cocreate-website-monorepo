'use client'
import { nestApiUrl } from '@cocreate/api-client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import CoCreateLogo from '@/components/cocreate-logo'
import DevSignInLink from '@/components/dev-sign-in-link'
import { alkatra600, bricolage_grot500, bricolage_grot600 } from '@/styles/fonts'


export default function ClientPortalLoginForm() {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('error')
  const authError = errorCode === 'auth'
  const clientRequired = errorCode === 'client_required'
  const sessionExpired = errorCode === 'session_expired'
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
      const response = await fetch(nestApiUrl('/client-portal/magic-link'), {
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
      <div className="portal-surface-solid w-full max-w-md p-8 sm:p-10">
        <CoCreateLogo href="/" className="h-9 w-auto" priority />
        <p className="portal-eyebrow mt-8">Client Portal</p>
        <h1 className={`mt-2 text-2xl text-chambray sm:text-3xl ${alkatra600.className}`}>
          Sign in
        </h1>
        <p className={`mt-2 text-sm leading-relaxed text-app-muted ${bricolage_grot500.className}`}>
          Enter the email address assigned by your CoCreate team.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            className="portal-input text-base"
          />
          <button
            type="submit"
            disabled={submitting}
            className="portal-btn-primary w-full disabled:opacity-60"
          >
            {submitting ? 'Sending link…' : 'Email me a sign-in link'}
          </button>
        </form>

        {clientRequired && !message ? (
          <p className="portal-alert-warn mt-4">
            This email is not authorized for the Client Portal. Use the email your CoCreate
            team invited, or sign in to the Admin Center instead.
          </p>
        ) : null}
        {sessionExpired && !message ? (
          <p className="portal-alert-warn mt-4">
            Your session expired. Request a new sign-in link below.
          </p>
        ) : null}
        {authError && !message ? (
          <p className="portal-alert-warn mt-4">
            That sign-in link expired or was already used. Request a new invite from your
            CoCreate team.
          </p>
        ) : null}
        {message ? <p className="portal-alert-success mt-4">{message}</p> : null}
        {devSignInUrl ? <DevSignInLink url={devSignInUrl} /> : null}
        {error ? <p className="portal-alert-error mt-4">{error}</p> : null}

        <div className={`mt-8 flex flex-col gap-3 text-sm ${bricolage_grot500.className}`}>
          <Link
            href="/"
            className={`inline-flex w-fit text-sanmarino transition hover:text-chambray ${bricolage_grot600.className}`}
          >
            ← Back to portal home
          </Link>
          {/* Do not use <Link href="/auth/signout"> — Link prefetch GETs the route and signs users out. */}
          <button
            type="button"
            onClick={() => {
              window.location.assign('/auth/signout')
            }}
            className="inline-flex w-fit text-app-muted transition hover:text-chambray"
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  )
}
