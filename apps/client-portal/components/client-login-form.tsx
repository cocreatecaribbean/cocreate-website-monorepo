'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import CoCreateLogo from '@/components/cocreate-logo'
import DevSignInLink from '@/components/dev-sign-in-link'
import { alkatra600, bricolage_grot500, bricolage_grot600 } from '@/styles/fonts'

const apiBase = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export default function ClientPortalLoginForm() {
  const searchParams = useSearchParams()
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
      const response = await fetch(`${apiBase()}/client-portal/magic-link`, {
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
        <p className={`mt-2 text-sm leading-relaxed text-slate-600 ${bricolage_grot500.className}`}>
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
            className="w-full rounded-full border border-chambray/12 bg-white/90 px-5 py-3 text-base shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sanmarino focus:ring-2 focus:ring-sanmarino/20"
          />
          <button
            type="submit"
            disabled={submitting}
            className="portal-btn-primary w-full disabled:opacity-60"
          >
            {submitting ? 'Sending link…' : 'Email me a sign-in link'}
          </button>
        </form>

        {authError && !message ? (
          <p className="mt-4 rounded-2xl bg-amber-50/90 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200/60">
            That sign-in link expired or was already used. Request a new invite from your
            CoCreate team.
          </p>
        ) : null}
        {message ? (
          <p className="mt-4 rounded-2xl bg-emerald-50/90 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200/60">
            {message}
          </p>
        ) : null}
        {devSignInUrl ? <DevSignInLink url={devSignInUrl} /> : null}
        {error ? (
          <p className="mt-4 rounded-2xl bg-red-50/90 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200/60">
            {error}
          </p>
        ) : null}

        <div className={`mt-8 flex flex-col gap-3 text-sm ${bricolage_grot500.className}`}>
          <Link
            href="/"
            className={`inline-flex w-fit text-sanmarino transition hover:text-chambray ${bricolage_grot600.className}`}
          >
            ← Back to portal home
          </Link>
          <Link
            href="/auth/signout"
            className="inline-flex w-fit text-slate-500 transition hover:text-chambray"
          >
            Sign out
          </Link>
        </div>
      </div>
    </main>
  )
}
