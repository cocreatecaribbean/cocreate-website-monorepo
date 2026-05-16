'use client'

import { useRef, type RefObject } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const BREAKPOINT = 768

function measureHeroTransform(
  videoEl: HTMLElement,
  sectionEl: HTMLElement,
): { scale: number; xOffset: number } {
  const videoRect = videoEl.getBoundingClientRect()
  const containerRect = sectionEl.getBoundingClientRect()
  const videoWidth = videoRect.width || 1

  const scale = containerRect.width / videoWidth
  const videoCenter = videoRect.left + videoRect.width / 2
  const containerCenter = containerRect.left + containerRect.width / 2
  const xOffset = containerCenter - videoCenter

  return { scale: Number.isFinite(scale) ? scale : 1, xOffset }
}

type UseAboutHeroAnimationOptions = {
  scope: RefObject<HTMLElement | null>
}

export function useAboutHeroAnimation({ scope }: UseAboutHeroAnimationOptions) {
  const sectionRef = useRef<HTMLElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)

  const refreshScroll = () => {
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }

  useGSAP(
    () => {
      ScrollTrigger.config({ ignoreMobileResize: true })

      const section = sectionRef.current
      const media = mediaRef.current
      if (!section || !media) return

      gsap.set(section, { autoAlpha: 1 })

      const mm = gsap.matchMedia()

      mm.add(
        {
          isDesktop: `(min-width: ${BREAKPOINT}px)`,
          isMobile: `(max-width: ${BREAKPOINT - 1}px)`,
        },
        (context) => {
          const { isDesktop, isMobile } = context.conditions as {
            isDesktop: boolean
            isMobile: boolean
          }

          gsap.set([media, '.about-hero-text'], { clearProps: 'transform,opacity' })

          if (isMobile) {
            gsap.set([media, '.about-hero-text'], { opacity: 1, y: 0 })

            const reveal = gsap.timeline({ paused: true })
            reveal
              .from(media, { y: 36, duration: 0.9, ease: 'power2.out', immediateRender: false })
              .from(
                '.about-hero-text',
                { y: 28, duration: 0.9, ease: 'power2.out', immediateRender: false },
                '-=0.55',
              )

            const playReveal = () => reveal.play()

            ScrollTrigger.create({
              trigger: section,
              start: 'top 88%',
              once: true,
              onEnter: playReveal,
            })

            if (ScrollTrigger.isInViewport(section, 0.2)) {
              playReveal()
            }

            return
          }

          if (!isDesktop) return

          requestAnimationFrame(() => {
            ScrollTrigger.refresh()
            const { scale, xOffset } = measureHeroTransform(media, section)

            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: section,
                start: 'top 20%',
                end: '+=1000',
                scrub: true,
                pin: true,
                pinType: 'transform',
                anticipatePin: 1,
                invalidateOnRefresh: true,
              },
            })

            tl.from(
              media,
              {
                scale,
                x: xOffset,
                transformOrigin: 'top center',
                ease: 'power3.inOut',
                duration: 1,
              },
              0,
            ).from(
              '.about-hero-text',
              {
                opacity: 0,
                ease: 'power2.inOut',
                duration: 1,
              },
              '<',
            )

            tl.to({}, { duration: 0.5 })
          })
        },
      )

      return () => mm.revert()
    },
    { scope },
  )

  return { sectionRef, mediaRef, refreshScroll }
}
