'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import SocialLinks from '@/components/social-icons'
import ButtonWithRef from '@/components/button'
import { CONTACT_FIELD_LIMITS } from '@/lib/contact-schema'
import { contactInfo } from '@/site-info/contact-page-data'
import * as fonts from '@/styles/fonts'

const fieldClassName =
  'w-full rounded-full border-0 bg-[#F0F2F5] px-4 py-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-sanmarino/25'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startedAtRef = useRef<number>(0)
  const honeypotRef = useRef<HTMLInputElement | null>(null)
  const turnstileRef = useRef<TurnstileInstance | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''
  const [turnstileReady, setTurnstileReady] = useState(false)

  useEffect(() => {
    startedAtRef.current = Date.now()
    setTurnstileReady(true)
  }, [])

  const resetTurnstile = () => {
    setTurnstileToken(null)
    turnstileRef.current?.reset()
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setSuccess(null)
    setError(null)

    if (!turnstileToken) {
      setError('Security check is still loading. Please try again in a moment.')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message,
          // Uncontrolled honeypot — avoid React state so autofill doesn't stick via controlled value
          companyFax: honeypotRef.current?.value ?? '',
          turnstileToken,
          startedAt: startedAtRef.current,
        }),
      })
      const data = (await response.json()) as { ok?: boolean; message?: string }

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? 'Unable to send your message right now.')
      }

      setSuccess(data.message ?? 'Thanks! Your message has been sent.')
      setName('')
      setEmail('')
      setMessage('')
      if (honeypotRef.current) honeypotRef.current.value = ''
      startedAtRef.current = Date.now()
      resetTurnstile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send your message right now.')
      resetTurnstile()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start lg:gap-16 xl:gap-24">
      <aside className={`${fonts.bricolage_grot400.className}`}>
        <h2
          className={`text-[2rem] leading-tight text-chambray sm:text-4xl lg:text-[2.75rem] ${fonts.bricolage_grot700.className}`}
        >
          Get in Touch!
        </h2>

        <dl className="mt-10 space-y-8 sm:mt-12">
          <div>
            <dt className="text-sm text-neutral-500">Tele:</dt>
            <dd className="mt-1">
              <a
                href={contactInfo.phoneHref}
                className={`text-lg text-slate-900 transition hover:text-chambray sm:text-xl ${fonts.bricolage_grot600.className}`}
              >
                {contactInfo.phone}
              </a>
            </dd>
          </div>

          <div>
            <dt className="text-sm text-neutral-500">E-Mail:</dt>
            <dd className="mt-1">
              <a
                href={`mailto:${contactInfo.email}`}
                className={`break-all text-lg text-slate-900 transition hover:text-chambray sm:text-xl ${fonts.bricolage_grot600.className}`}
              >
                {contactInfo.email}
              </a>
            </dd>
          </div>

          <div>
            <dt className="text-sm text-neutral-500">Follow:</dt>
            <dd className="mt-3">
              <SocialLinks color="blue" icon_width={40} align="start" />
            </dd>
          </div>
        </dl>
      </aside>

      <section className={`mt-10 lg:mt-0 ${fonts.bricolage_grot400.className}`}>
        <h3
          className={`mb-6 text-left text-xl text-chambray lg:hidden ${fonts.bricolage_grot600.className}`}
        >
          Send us a message
        </h3>
        {/* suppressHydrationWarning: Chrome on iOS injects __gcruniqueid attributes
            into form elements before React hydrates */}
        <form onSubmit={onSubmit} className="space-y-5" noValidate suppressHydrationWarning>
          {/* Honeypot: obscure name + uncontrolled so Chrome autofill does not trip it */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
          >
            <label htmlFor="contact-company-fax">Company fax</label>
            <input
              ref={honeypotRef}
              id="contact-company-fax"
              type="text"
              name="company_fax"
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
              maxLength={CONTACT_FIELD_LIMITS.companyFax}
              suppressHydrationWarning
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="contact-name"
                className={`mb-2 block text-sm text-neutral-600 ${fonts.bricolage_grot500.className}`}
              >
                Name
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                maxLength={CONTACT_FIELD_LIMITS.name}
                className={fieldClassName}
                suppressHydrationWarning
              />
            </div>

            <div>
              <label
                htmlFor="contact-email"
                className={`mb-2 block text-sm text-neutral-600 ${fonts.bricolage_grot500.className}`}
              >
                E-Mail
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                maxLength={CONTACT_FIELD_LIMITS.email}
                className={fieldClassName}
                suppressHydrationWarning
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="contact-message"
              className={`mb-2 block text-sm text-neutral-600 ${fonts.bricolage_grot500.className}`}
            >
              Message
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              rows={7}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              minLength={CONTACT_FIELD_LIMITS.messageMin}
              maxLength={CONTACT_FIELD_LIMITS.message}
              className={`${fieldClassName} min-h-[10rem] resize-y rounded-4xl!`}
              suppressHydrationWarning
            />
          </div>

          {turnstileReady && siteKey ? (
            <div className="contents">
              <Turnstile
                ref={turnstileRef}
                siteKey={siteKey}
                options={{
                  action: 'contact',
                  theme: 'light',
                  size: 'invisible',
                  appearance: 'interaction-only',
                }}
                onSuccess={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
              />
            </div>
          ) : null}
          {turnstileReady && !siteKey ? (
            <p className="text-sm text-amber-700" role="status">
              Security check is not configured. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY in
              Doppler.
            </p>
          ) : null}

          <ButtonWithRef
            type="submit"
            variant="casablanca"
            disabled={submitting || !siteKey}
            className="w-full min-h-12 px-6 py-3.5 text-base"
          >
            {submitting ? 'Sending…' : 'Send'}
          </ButtonWithRef>

          {success ? (
            <p className="text-sm leading-relaxed text-emerald-700" role="status">
              {success}
            </p>
          ) : null}
          {error ? (
            <p className="text-sm leading-relaxed text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  )
}
