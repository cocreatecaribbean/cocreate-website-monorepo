'use client'

import { FormEvent, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import CoCreateLogo from '@/components/cocreate-logo'
import DevSignInLink from '@/components/dev-sign-in-link'

const apiBase = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export default function AdminLoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'
  const authError = searchParams.get('error') === 'auth'
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
    <main className="flex min-h-svh items-center justify-center bg-[#eef1f8] px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-chambray/10 bg-white p-8 shadow-sm">
        <CoCreateLogo href="/" className="h-9 w-auto" priority />
        <p className="mt-6 text-sm font-medium uppercase tracking-[0.18em] text-sanmarino">
          CoCreate Control Center
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-chambray">Admin sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
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
            className="w-full rounded-full border border-chambray/15 px-5 py-3 text-base outline-none focus:border-sanmarino"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-chambray px-6 py-3 text-sm font-semibold text-white transition hover:bg-sanmarino disabled:opacity-60"
          >
            {submitting ? 'Sending link…' : 'Email me a sign-in link'}
          </button>
        </form>

        {authError && !message ? (
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            That sign-in link expired or was already used. Request a new link below.
          </p>
        ) : null}
        {message ? (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </p>
        ) : null}
        {devSignInUrl ? <DevSignInLink url={devSignInUrl} /> : null}
        {error ? (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <p className="mt-6 text-xs text-slate-500">
          After signing in you&apos;ll return to {next === '/' ? 'the dashboard' : next}.
        </p>
      </div>
    </main>
  )
}
