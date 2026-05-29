'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import CoCreateLogo from '@/components/cocreate-logo'
import DevSignInLink from '@/components/dev-sign-in-link'
import ThemeToggle from '@/components/theme-toggle'
import { alkatra600, bricolage_grot500 } from '@/styles/fonts'

const apiBase = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export default function CollaboratorLoginForm() {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('error')
  const authError = errorCode === 'auth'
  const collaboratorRequired = errorCode === 'collaborator_required'
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
      const response = await fetch(`${apiBase()}/auth/collaborator/magic-link`, {
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
      if (data.devSignInUrl) setDevSignInUrl(data.devSignInUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle variant="header" />
      </div>
      <CoCreateLogo className="mb-10 h-12 w-auto" />
      <div className="admin-glass-card w-full max-w-md p-8">
        <h1 className={`text-center text-xl text-chambray ${alkatra600.className}`}>
          Collaborator sign-in
        </h1>
        <p className={`mt-2 text-center text-sm text-app-muted ${bricolage_grot500.className}`}>
          Use the email address you were invited with.
        </p>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="admin-input w-full"
          />
          <button
            type="submit"
            disabled={submitting}
            className="admin-btn-primary w-full"
          >
            {submitting ? 'Sending…' : 'Email me a sign-in link'}
          </button>
        </form>
        {authError && !message ? (
          <p className="admin-alert-warn mt-4 text-center text-sm">
            That sign-in link expired or was already used. Request a new link below.
          </p>
        ) : null}
        {collaboratorRequired && !message ? (
          <p className="admin-alert-warn mt-4 text-center text-sm">
            This account is not set up as a collaborator, or you need a project assignment
            before you can sign in. Use the email you were invited with, or ask your CoCreate
            contact to assign you to a project.
          </p>
        ) : null}
        {message ? <p className="mt-4 text-center text-sm text-sanmarino">{message}</p> : null}
        {error ? <p className="mt-4 text-center text-sm text-red-600">{error}</p> : null}
        {devSignInUrl ? <DevSignInLink url={devSignInUrl} /> : null}
        <p className="mt-6 text-center text-xs text-app-muted">
          CoCreate team?{' '}
          <Link href="/login" className="text-sanmarino underline">
            Admin sign-in
          </Link>
        </p>
      </div>
    </div>
  )
}
