'use client'

import { FormEvent, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight } from 'lucide-react'
import * as fonts from '@/styles/fonts'
import { useClientPortalLogin } from '@/components/client-portal/client-portal-provider'
import { useSearch } from '@/components/search/search-provider'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

export default function ClientPortalLoginOverlay() {
  const { isOpen: isClientPortalActive, closeClientPortalLogin } = useClientPortalLogin()
  const { isOpen: isSearchOpen } = useSearch()
  const isOverlayVisible = isClientPortalActive && !isSearchOpen
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogId = useId()
  const labelId = `${dialogId}-label`
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOverlayVisible) return

    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.classList.add('client-portal-open')

    const frame = requestAnimationFrame(() => inputRef.current?.focus())

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeClientPortalLogin()
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      cancelAnimationFrame(frame)
      document.documentElement.style.overflow = previousOverflow
      document.body.classList.remove('client-portal-open')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOverlayVisible, closeClientPortalLogin])

  useEffect(() => {
    if (!isOverlayVisible) {
      setEmail('')
      setError(null)
      setSuccess(null)
      setSubmitting(false)
    }
  }, [isOverlayVisible])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/client-portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = (await response.json()) as {
        ok?: boolean
        message?: string
      }

      if (!response.ok || !data.ok) {
        setError(
          data.message ??
            'This email does not have client portal access. Contact CoCreate if you need help.',
        )
        return
      }

      setSuccess(data.message ?? 'Check your email for a sign-in link.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div
      aria-hidden={!isOverlayVisible}
      className={`fixed inset-0 z-[210] ${isOverlayVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        aria-label="Close client portal sign in"
        tabIndex={isOverlayVisible ? 0 : -1}
        onClick={closeClientPortalLogin}
        className={`absolute inset-0 bg-black/25 backdrop-blur-xl transition-opacity duration-500 ease-out ${isOverlayVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{
          opacity: isOverlayVisible ? 1 : 0,
          transitionTimingFunction: EASE,
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-y-auto px-6 py-16"
      >
        <div
          className={`flex w-full max-w-[min(92vw,42rem)] flex-col items-center gap-3 ${isOverlayVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
          style={{
            opacity: isOverlayVisible ? 1 : 0,
            transform: isOverlayVisible ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(12px)',
            transition: `opacity 520ms ${EASE}, transform 520ms ${EASE}`,
          }}
        >
          <p
            className={`text-center text-sm text-white/85 ${fonts.bricolage_grot400.className}`}
          >
            <span className="md:hidden">Tap outside to close</span>
            <span className="hidden md:inline">
              Press ESC or click outside to close
            </span>
          </p>

          <form
            onSubmit={onSubmit}
            className={`
              relative flex w-full flex-col gap-4
              rounded-[2rem] bg-white px-6 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]
              sm:rounded-full sm:flex-row sm:items-center sm:gap-3 sm:px-8 sm:py-5
              ${fonts.bricolage_grot400.className}
            `}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="min-w-0 flex-1">
              <label id={labelId} htmlFor={`${dialogId}-email`} className="sr-only">
                Email address
              </label>
              <input
                ref={inputRef}
                id={`${dialogId}-email`}
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                placeholder="Enter your assigned email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                tabIndex={isOverlayVisible ? 0 : -1}
                disabled={submitting}
                className="
                  w-full border-0 bg-transparent text-base text-black
                  outline-none placeholder:text-black/70
                  sm:text-lg md:text-xl
                "
              />
            </div>
            <button
              type="submit"
              aria-label="Continue to client portal"
              tabIndex={isOverlayVisible ? 0 : -1}
              disabled={submitting}
              className="inline-flex shrink-0 items-center justify-center gap-2 self-end rounded-full bg-chambray px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sanmarino disabled:opacity-60 sm:self-auto"
            >
              {submitting ? 'Sending…' : 'Send sign-in link'}
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </form>

          <p
            className={`max-w-md text-center text-xs text-white/80 sm:text-sm ${fonts.bricolage_grot400.className}`}
          >
            Client portal access is invite-only.
          </p>

          {success ? (
            <p
              className={`max-w-md rounded-2xl bg-white/95 px-4 py-3 text-center text-sm text-emerald-800 ${fonts.bricolage_grot400.className}`}
              role="status"
            >
              {success}
            </p>
          ) : null}

          {error ? (
            <p
              className={`max-w-md rounded-2xl bg-white/95 px-4 py-3 text-center text-sm text-red-700 ${fonts.bricolage_grot400.className}`}
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
