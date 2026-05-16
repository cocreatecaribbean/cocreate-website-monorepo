'use client'

import { useRef, type RefObject } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, useGSAP, SplitText)

const PIN_ID = 'about-hero-pin'

function measureWideTransform(
  mediaEl: HTMLElement,
  sectionEl: HTMLElement,
): { scale: number; xOffset: number } {
  const mediaRect = mediaEl.getBoundingClientRect()
  const sectionRect = sectionEl.getBoundingClientRect()
  const mediaWidth = mediaRect.width || 1

  const scale = sectionRect.width / mediaWidth
  const mediaCenter = mediaRect.left + mediaRect.width / 2
  const sectionCenter = sectionRect.left + sectionRect.width / 2

  return {
    scale: Number.isFinite(scale) ? scale : 1,
    xOffset: sectionCenter - mediaCenter,
  }
}

function createPinTimeline(
  section: HTMLElement,
  config: {
    end: string
    pinStart: string
    onBuild: (timeline: gsap.core.Timeline) => void
  },
) {
  const tl = gsap.timeline({
    defaults: { immediateRender: false },
    scrollTrigger: {
      id: PIN_ID,
      trigger: section,
      start: config.pinStart,
      end: config.end,
      scrub: 0.55,
      pin: true,
      pinSpacing: true,
      pinType: 'transform',
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  })

  config.onBuild(tl)
  return tl
}

type UseAboutHeroAnimationOptions = {
  scope: RefObject<HTMLElement | null>
}

export function useAboutHeroAnimation({ scope }: UseAboutHeroAnimationOptions) {
  const sectionRef = useRef<HTMLElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)

  const refreshScroll = () => {
    requestAnimationFrame(() => ScrollTrigger.refresh(true))
  }

  useGSAP(
    () => {
      ScrollTrigger.config({ ignoreMobileResize: true })

      const section = sectionRef.current
      const media = mediaRef.current
      if (!section || !media) return

      const text = section.querySelector<HTMLElement>('.about-hero-text')

      gsap.set(section, { autoAlpha: 1, visibility: 'visible' })

      const syncPinAtRest = () => {
        const st = ScrollTrigger.getById(PIN_ID)
        const anim = st?.animation
        if (!st || !(anim instanceof gsap.core.Timeline)) return
        if (st.scroll() < st.start) anim.progress(1)
      }

      ScrollTrigger.addEventListener('refreshInit', syncPinAtRest)

      const mm = gsap.matchMedia()

      // Up to large laptop: stacked layout + scroll-scrub (no pin — avoids text over image on iPad)
      mm.add('(max-width: 1499px)', () => {
        if (text) {
          gsap.set(text, { clearProps: 'transform,opacity,x,y' })
        }

        const heading = text?.querySelector<HTMLElement>('.about-hero-heading')
        const body = text?.querySelector<HTMLElement>('.about-hero-body')
        const split = heading ? new SplitText(heading, { type: 'words' }) : null

        gsap.set(media, {
          scale: 0.52,
          y: 52,
          opacity: 1,
          clipPath: 'inset(22% 14% 22% 14% round 1.75rem)',
        })

        if (split) {
          gsap.set(split.words, { opacity: 1, y: 28 })
        }

        if (body) {
          gsap.set(body, { opacity: 0, y: 36 })
        }

        const scrollTl = gsap.timeline({
          defaults: { ease: 'none', immediateRender: false },
          scrollTrigger: {
            trigger: section,
            start: 'top 82%',
            end: '+=95%',
            scrub: 0.4,
          },
        })

        scrollTl.to(
          media,
          {
            scale: 1,
            y: 0,
            clipPath: 'inset(0% 0% 0% 0% round 1.5rem)',
            duration: 0.7,
          },
          0,
        )

        if (split) {
          scrollTl.to(
            split.words,
            {
              y: 0,
              stagger: { each: 0.06, from: 'start' },
              duration: 0.65,
            },
            0.12,
          )
        }

        if (body) {
          scrollTl.to(body, { opacity: 1, y: 0, duration: 0.45 }, 0.5)
        }

        return () => {
          split?.revert()
        }
      })

      // Wide desktop only: side-by-side pin
      mm.add('(min-width: 1500px)', () => {
        const targets = [media, text].filter(Boolean) as HTMLElement[]
        gsap.set(targets, { clearProps: 'transform,opacity,x,y,scale' })

        ScrollTrigger.refresh(true)

        const { scale, xOffset } = measureWideTransform(media, section)

        const tl = createPinTimeline(section, {
          pinStart: 'top 18%',
          end: '+=1050',
          onBuild: (timeline) => {
            timeline
              .from(
                media,
                {
                  scale,
                  x: xOffset,
                  transformOrigin: 'top center',
                  ease: 'power3.inOut',
                  duration: 1,
                },
                0,
              )
              .from(
                text,
                { opacity: 0, ease: 'power2.inOut', duration: 1 },
                '<',
              )
              .to({}, { duration: 0.4 })
          },
        })

        syncPinAtRest()
        tl.scrollTrigger?.update()
      })

      return () => {
        ScrollTrigger.removeEventListener('refreshInit', syncPinAtRest)
        mm.revert()
      }
    },
    { scope },
  )

  return { sectionRef, mediaRef, refreshScroll }
}
