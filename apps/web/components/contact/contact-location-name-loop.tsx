'use client'

import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useRef } from 'react'
import * as fonts from '@/styles/fonts'
import { contactPageHero } from '@/site-info/contact-page-data'

gsap.registerPlugin(useGSAP)

const NAMES = contactPageHero.locationNames
const HOLD_SECONDS = 2.4
const FLIP_SECONDS = 0.55

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Cycles Jamaica aliases — same face/weight as the static pill label.
 * Width eases with each phrase; text stays visible (no blank gap, no clipping).
 */
export default function ContactLocationNameLoop() {
  const slotRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const slot = slotRef.current
      const text = textRef.current
      const measure = measureRef.current
      if (!slot || !text || !measure) return

      const measureWidth = (name: string) => {
        measure.textContent = name
        return Math.ceil(measure.getBoundingClientRect().width)
      }

      text.textContent = NAMES[0]
      gsap.set(text, { opacity: 1 })
      gsap.set(slot, { width: measureWidth(NAMES[0]) })

      if (prefersReducedMotion()) {
        return () => {
          gsap.set(slot, { clearProps: 'width' })
        }
      }

      const tl = gsap.timeline({ repeat: -1 })

      NAMES.forEach((_, i) => {
        const next = NAMES[(i + 1) % NAMES.length]

        tl.to({}, { duration: HOLD_SECONDS })
          // Soft dip — never fully blank — then swap and ease width
          .to(text, {
            opacity: 0.25,
            duration: FLIP_SECONDS * 0.35,
            ease: 'power1.in',
          })
          .add(() => {
            text.textContent = next
          })
          .to(
            slot,
            {
              width: () => measureWidth(next),
              duration: FLIP_SECONDS,
              ease: 'power2.inOut',
            },
            '<',
          )
          .to(
            text,
            {
              opacity: 1,
              duration: FLIP_SECONDS * 0.65,
              ease: 'power1.out',
            },
            '<',
          )
      })

      return () => {
        tl.kill()
        gsap.set(slot, { clearProps: 'width' })
      }
    },
    { scope: slotRef },
  )

  return (
    <span
      ref={slotRef}
      className={`inline-block overflow-x-hidden align-baseline text-casablanca ${fonts.bricolage_grot700.className}`}
    >
      <span ref={textRef} aria-live="polite" className="inline-block whitespace-nowrap">
        {NAMES[0]}
      </span>
      <span
        ref={measureRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-[-9999px] whitespace-nowrap opacity-0"
      >
        {NAMES[0]}
      </span>
    </span>
  )
}
