'use client'

import { useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'
import * as fonts from '@/styles/fonts'
import { contactPageHero, contactPageTitle } from '@/site-info/contact-page-data'
import { useContactHeadlineWave } from '@/hooks/use-contact-headline-wave'
import ContactLocationNameLoop from '@/components/contact/contact-location-name-loop'

export default function ContactPageHeader() {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  useContactHeadlineWave({ scope: sectionRef })

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // iOS decodes the VP9 webm but ignores its alpha channel, turning the
    // transparent canvas black — force the white-composited mp4 there.
    const isIos =
      /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    if (isIos && !video.currentSrc.endsWith('.mp4')) {
      video.src = '/videos/cocreate-globe-loop_seamless-h264-white.mp4'
      video.load()
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncPlayback = () => {
      if (media.matches) {
        video.pause()
        video.currentTime = 0
        return
      }
      void video.play().catch(() => {
        // iOS can tear down the decoder while backgrounded, making play()
        // reject until the element is reloaded.
        video.load()
        void video.play().catch(() => {
          /* autoplay blocked — nothing more we can do */
        })
      })
    }

    // iOS suspends the video when the page is backgrounded or restored from
    // the back/forward cache and won't resume it on its own.
    const resumeIfVisible = () => {
      if (document.visibilityState === 'visible') syncPlayback()
    }

    // iOS also fires a plain `pause` on the element when the app is
    // minimized; if we're (back to) visible, immediately resume.
    const onPause = () => {
      if (document.visibilityState === 'visible' && !media.matches) {
        void video.play().catch(() => {})
      }
    }

    syncPlayback()
    media.addEventListener('change', syncPlayback)
    document.addEventListener('visibilitychange', resumeIfVisible)
    window.addEventListener('pageshow', resumeIfVisible)
    window.addEventListener('focus', resumeIfVisible)
    video.addEventListener('pause', onPause)
    return () => {
      media.removeEventListener('change', syncPlayback)
      document.removeEventListener('visibilitychange', resumeIfVisible)
      window.removeEventListener('pageshow', resumeIfVisible)
      window.removeEventListener('focus', resumeIfVisible)
      video.removeEventListener('pause', onPause)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="
        contact-page-header mx-auto mb-16 grid w-[88svw] max-w-[1320px]
        grid-cols-1 items-center gap-4 text-black
        pt-[calc(5svh+3.5rem)] sm:pt-[calc(5svh+4rem)]
        min-[1024px]:mb-20 min-[1024px]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]
        min-[1024px]:items-center min-[1024px]:gap-16
        min-[1024px]:pt-[calc(8svh+5rem)]
        min-[1500px]:mb-24 min-[1500px]:pt-52
        xl:gap-24
        landscape:pt-20 landscape:lg:pt-44 landscape:xl:pt-64
      "
    >
      <div
        className="
          relative mx-auto -mb-14 w-[min(78vw,360px)]
          min-[1024px]:mx-0 min-[1024px]:mb-0 min-[1024px]:w-full min-[1024px]:max-w-[520px]
          min-[1500px]:max-w-[580px]
        "
      >
        <div
          className="
            relative aspect-square w-full overflow-hidden rounded-full
            min-[1024px]:[mask-image:radial-gradient(circle,black_62%,transparent_78%)]
            min-[1024px]:[-webkit-mask-image:radial-gradient(circle,black_62%,transparent_78%)]
          "
        >
          <video
            ref={videoRef}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            aria-hidden
          >
            {/* Transparent-alpha webm for browsers that render VP9 alpha;
                iOS is switched to the white-composited mp4 in the effect above. */}
            <source
              src="/videos/cocreate-globe-loop_seamless.webm"
              type="video/webm"
            />
            <source
              src="/videos/cocreate-globe-loop_seamless-h264-white.mp4"
              type="video/mp4"
            />
          </video>
        </div>
      </div>

      <div className="flex w-full min-w-0 -translate-x-3 flex-col items-center text-center min-[1024px]:-translate-x-5">
        <h1
          className="
            contact-page-title w-fit overflow-visible text-center leading-none
            uppercase opacity-100
          "
        >
          <span
            className={`text-[clamp(1.85rem,6vw,3.5rem)] min-[1500px]:text-[clamp(3rem,4vw,6rem)] ${fonts.alkatra400.className}`}
          >
            {contactPageTitle.lineOne}
          </span>
          <span
            aria-hidden
            className="contact-page-title-space inline-block min-w-[0.45em] w-[0.45em]"
          >
            {'\u00A0'}
          </span>
          <span
            className={`whitespace-nowrap text-[clamp(2.75rem,8vw,5rem)] min-[1500px]:text-[clamp(4rem,5vw,7rem)] ${fonts.bricolage_grot800.className}`}
          >
            {contactPageTitle.lineTwo}
          </span>
        </h1>

        <p
          className={`
            mt-4 max-w-[28ch] translate-x-3 text-[clamp(0.95rem,2.1vw,1.35rem)] font-medium
            uppercase tracking-[0.04em] text-chambray
            min-[1024px]:max-w-none min-[1024px]:translate-x-5
            ${fonts.bricolage_grot500.className}
          `}
        >
          {contactPageHero.subtitle}
        </p>

        <div
          role="note"
          className={`
            mt-6 inline-flex max-w-none flex-nowrap items-center justify-center gap-x-1.5
            whitespace-nowrap rounded-full bg-chambray px-4 py-2.5
            text-[clamp(0.62rem,1.35vw,0.82rem)] font-medium uppercase tracking-[0.05em]
            text-white translate-x-3
            sm:gap-x-2 sm:px-6 sm:py-3
            min-[1024px]:translate-x-5
            ${fonts.bricolage_grot500.className}
          `}
        >
          <span>{contactPageHero.locationLead}</span>
          <MapPin
            className="h-[1.15em] w-[1.15em] shrink-0 text-casablanca"
            aria-hidden
            strokeWidth={2.5}
          />
          <ContactLocationNameLoop />
          <span>{contactPageHero.locationAsk}</span>
        </div>
      </div>
    </section>
  )
}
