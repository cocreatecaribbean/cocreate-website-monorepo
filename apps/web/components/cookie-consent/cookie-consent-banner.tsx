'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useId, useRef } from 'react'
import logo from '@/public/co_create_logo_hor_wht.svg'
import { useCookieConsent } from '@/components/cookie-consent/cookie-consent-context'
import * as fonts from '@/styles/fonts'

export default function CookieConsentBanner() {
  const headingId = useId()
  const descriptionId = useId()
  const rejectRef = useRef<HTMLButtonElement>(null)
  const { acceptAll, rejectOptional } = useCookieConsent()

  useEffect(() => {
    rejectRef.current?.focus()
  }, [])

  const dismiss = (choice: 'accept' | 'reject') => {
    if (choice === 'accept') {
      acceptAll()
    } else {
      rejectOptional()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      aria-live="polite"
      className={`cookie-consent-banner fixed right-4 z-[240] w-[min(calc(100vw-2rem),22rem)] rounded-2xl border border-white/10 bg-chambray text-white shadow-[0_8px_32px_rgba(57,65,154,0.35)] bottom-[max(1.25rem,env(safe-area-inset-bottom))] sm:right-6 sm:bottom-8 ${fonts.bricolage_grot400.className}`}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <Image
            src={logo}
            alt=""
            aria-hidden
            className="mt-0.5 h-5 w-auto shrink-0"
          />
          <div className="min-w-0">
            <h2
              id={headingId}
              className={`text-base text-white ${fonts.bricolage_grot700.className}`}
            >
              Cookie preferences
            </h2>
            <p
              id={descriptionId}
              className="mt-1.5 text-sm leading-relaxed text-white/85"
            >
              We use essential cookies so this site works. With your permission, we also use
              analytics cookies to understand how visitors use our site.{' '}
              <Link
                href="/privacy#cookies"
                className="text-casablanca underline underline-offset-2 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-casablanca"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => dismiss('accept')}
            className={`inline-flex min-h-11 w-full items-center justify-center rounded-full bg-casablanca px-5 py-2.5 text-sm text-chambray transition hover:bg-amber-200 hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-casablanca ${fonts.bricolage_grot600.className}`}
          >
            Accept
          </button>
          <button
            ref={rejectRef}
            type="button"
            onClick={() => dismiss('reject')}
            className={`inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/25 px-5 py-2.5 text-sm text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${fonts.bricolage_grot600.className}`}
          >
            Reject non-essential
          </button>
        </div>
      </div>
    </div>
  )
}
