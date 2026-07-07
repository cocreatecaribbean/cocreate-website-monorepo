'use client'

import { FormEvent, useState } from 'react'
import SocialLinks from '@/components/social-icons'
import { contactInfo } from '@/site-info/contact-page-data'
import * as fonts from '@/styles/fonts'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setSuccess(null)
    setError(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, website }),
      })
      const data = (await response.json()) as { ok?: boolean; message?: string }

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? 'Unable to send your message right now.')
      }

      setSuccess(data.message ?? 'Thanks! Your message has been sent.')
      setName('')
      setEmail('')
      setMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send your message right now.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
      <section
        className={`rounded-[2rem] border border-chambray/10 bg-white p-6 shadow-[0_8px_40px_rgba(57,65,154,0.08)] sm:p-8 ${fonts.bricolage_grot400.className}`}
      >
        <h2 className={`text-xl text-chambray sm:text-2xl ${fonts.bricolage_grot700.className}`}>
          Send a message
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{contactInfo.blurb}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="pointer-events-none absolute h-0 w-0 opacity-0"
          />

          <div>
            <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-chambray">
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
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sanmarino/50 focus:ring-2 focus:ring-sanmarino/15"
            />
          </div>

          <div>
            <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-chambray">
              Email
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sanmarino/50 focus:ring-2 focus:ring-sanmarino/15"
            />
          </div>

          <div>
            <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-chambray">
              Message
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sanmarino/50 focus:ring-2 focus:ring-sanmarino/15"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`inline-flex min-h-11 items-center justify-center rounded-full bg-casablanca px-6 py-3 text-sm text-chambray transition hover:bg-amber-200 hover:text-blue-900 disabled:opacity-60 ${fonts.bricolage_grot600.className}`}
          >
            {submitting ? 'Sending…' : 'Send message'}
          </button>

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

      <aside
        className={`rounded-[2rem] bg-chambray p-6 text-white sm:p-8 ${fonts.bricolage_grot400.className}`}
      >
        <h2 className={`text-xl sm:text-2xl ${fonts.bricolage_grot700.className}`}>Contact info</h2>
        <p className="mt-3 text-sm leading-relaxed text-white/85">
          Based in the {contactInfo.region}. Reach out for new projects, partnerships, or press.
        </p>
        <p className="mt-6">
          <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
            Email
          </span>
          <a
            href={`mailto:${contactInfo.email}`}
            className="mt-1 inline-block text-casablanca underline-offset-2 hover:underline"
          >
            {contactInfo.email}
          </a>
        </p>
        <div className="mt-8">
          <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
            Follow
          </span>
          <div className="mt-3">
            <SocialLinks color="yellow" icon_width={36} />
          </div>
        </div>
        <p className="mt-8 text-sm leading-relaxed text-white/75">
          Prefer a quick answer? Use the <strong className="font-semibold text-white">Ask CoCreate</strong>{' '}
          assistant in the bottom-right corner on any page.
        </p>
      </aside>
    </div>
  )
}
