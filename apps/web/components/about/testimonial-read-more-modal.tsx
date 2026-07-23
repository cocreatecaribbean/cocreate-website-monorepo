'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X } from 'lucide-react'
import * as fonts from '@/styles/fonts'
import { formatTestimonialQuoteParagraphs } from '@/lib/format-testimonial-quote'
import type { AboutTestimonial } from '@/types/about-testimonial'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

type TestimonialReadMoreModalProps = {
  testimonial: AboutTestimonial
  isOpen: boolean
  onClose: () => void
}

export default function TestimonialReadMoreModal({
  testimonial,
  isOpen,
  onClose,
}: TestimonialReadMoreModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogId = useId()
  const headingId = `${dialogId}-heading`
  const [mounted, setMounted] = useState(false)
  const quoteParagraphs = formatTestimonialQuoteParagraphs(testimonial.quote)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'

    const frame = requestAnimationFrame(() => closeButtonRef.current?.focus())

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      cancelAnimationFrame(frame)
      document.documentElement.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  if (!mounted) return null

  return createPortal(
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-[200] ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        aria-label="Close testimonial"
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
        className={`absolute inset-0 bg-black/25 backdrop-blur-xl transition-opacity duration-500 ease-out ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{
          opacity: isOpen ? 1 : 0,
          transitionTimingFunction: EASE,
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-y-auto px-6 py-16"
      >
        <article
          className={`relative w-full max-w-[min(92vw,36rem)] rounded-[2rem] bg-white p-6 shadow-[0_24px_80px_rgba(57,65,154,0.18)] sm:p-8 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
          style={{
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(12px)',
            transition: `opacity 520ms ${EASE}, transform 520ms ${EASE}`,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close"
            tabIndex={isOpen ? 0 : -1}
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-chambray/60 transition hover:bg-chambray/5 hover:text-chambray sm:right-5 sm:top-5"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>

          <header className="flex items-center gap-4 border-b border-chambray/8 pb-5 pr-10">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-md sm:h-[4.75rem] sm:w-[4.75rem]">
              <Image
                src={testimonial.photoUrl}
                alt=""
                fill
                sizes="76px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p
                id={headingId}
                className={`text-base text-gradient-chambray-diagonal sm:text-lg ${fonts.bricolage_grot700.className}`}
              >
                {testimonial.name}
              </p>
              {testimonial.jobTitle ? (
                <p
                  className={`mt-1 text-sm italic text-gradient-chambray-diagonal ${fonts.bricolage_grot500.className}`}
                >
                  {testimonial.jobTitle}
                </p>
              ) : null}
              <p
                className={`mt-0.5 text-sm text-gradient-chambray-diagonal ${fonts.bricolage_grot400.className}`}
              >
                {testimonial.company}
              </p>
            </div>
          </header>

          <div className="relative pt-5">
            <span
              className={`pointer-events-none absolute -left-1 top-3 select-none text-6xl leading-none text-casablanca/20 sm:text-7xl ${fonts.bricolage_grot700.className}`}
              aria-hidden
            >
              &ldquo;
            </span>
            <div
              className={`relative space-y-4 text-[0.95rem] leading-relaxed sm:text-base sm:leading-relaxed ${fonts.bricolage_grot400.className}`}
            >
              {quoteParagraphs.map((paragraph, index) => (
                <p
                  key={`${index}-${paragraph.slice(0, 24)}`}
                  className="text-gradient-chambray-diagonal"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </article>
      </div>
    </div>,
    document.body,
  )
}
