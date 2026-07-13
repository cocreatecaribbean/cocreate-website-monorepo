'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import * as fonts from '@/styles/fonts'
import { useAboutHeroAnimation } from '@/hooks/use-about-hero-animation'
import { useAboutPageContent } from '@/components/about/about-cms-provider'
import MuxVideoPlayer from '@/components/media/mux-video-player'

export default function AboutHeroSection() {
  const rootRef = useRef<HTMLElement>(null)
  const { sectionRef, mediaRef, refreshScroll } = useAboutHeroAnimation({ scope: rootRef })
  const about = useAboutPageContent()

  const useVideo =
    about.heroMediaType === 'video' && Boolean(about.heroVideoPlaybackId)
  const imageSrc = about.heroImageUrl || about.fallbackHeroImageSrc
  const imageIsRemote = imageSrc.startsWith('http')

  useEffect(() => {
    if (!useVideo) return
    refreshScroll()
    // refreshScroll is intentionally unstable (new fn each render from the animation hook)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when hero video changes
  }, [useVideo, about.heroVideoPlaybackId])

  return (
    <section ref={rootRef} aria-label="About CoCreate hero" className="pb-6 max-[767px]:pb-0 min-[768px]:max-[1499px]:pb-0 min-[1500px]:pb-0">
      <section
        ref={sectionRef}
        data-about-hero
        className="
          about-hero-section invisible
          w-[92svw] max-w-[1320px] min-[1500px]:max-w-[1480px] mx-auto
          grid grid-cols-1
          min-[1500px]:grid-cols-[1.15fr_1fr] min-[1500px]:items-center
          gap-10 sm:gap-12 min-[1024px]:max-[1499px]:gap-12 min-[1500px]:gap-14
          mb-8 max-[767px]:mb-2 min-[768px]:max-[1499px]:mb-3 min-[1500px]:mb-48
        "
      >
        <div
          ref={mediaRef}
          className="
            about-hero-media relative z-20 w-full max-w-[720px] min-[1500px]:max-w-none mx-auto
            min-[1500px]:mx-0 overflow-hidden rounded-3xl
            min-[1024px]:rounded-4xl min-[1500px]:rounded-[3.5rem]
            aspect-4/3             max-h-[42svh]
            min-[1024px]:max-h-[46svh] min-[1500px]:min-h-[46svh] min-[1500px]:max-h-[54svh]
          "
        >
          {useVideo ? (
            <MuxVideoPlayer
              playbackId={about.heroVideoPlaybackId!}
              title={about.heroHeading}
              autoPlay
              muted
              loop
              className="absolute inset-0 h-full w-full object-cover [--controls:none]"
            />
          ) : (
            <Image
              src={imageSrc}
              alt={about.fallbackHeroImageAlt}
              fill
              priority
              quality={75}
              sizes="(max-width: 1023px) 92vw, (max-width: 1499px) 720px, 55vw"
              placeholder={imageIsRemote ? 'empty' : 'blur'}
              blurDataURL={imageIsRemote ? undefined : about.fallbackHeroBlurDataURL}
              className="object-cover"
              onLoad={refreshScroll}
            />
          )}
        </div>

        <div
          className="
            about-hero-text relative z-0
            px-1 sm:px-4
            min-[1024px]:max-w-[640px] min-[1024px]:mx-auto
            min-[1500px]:max-w-none min-[1500px]:mx-0
            min-[1500px]:pl-16 min-[1500px]:pr-8
          "
        >
          <h2
            className={`
              about-hero-heading philosophy-header h-fit leading-none
              text-center min-[1500px]:text-left
              text-[clamp(1.85rem,4.5vw,3.25rem)] min-[1500px]:text-[clamp(2rem,3vw,4rem)]
              ${fonts.bricolage_grot500.className} mb-5 min-[1500px]:mb-6
            `}
          >
            {about.heroHeading}
          </h2>
          <p
            className={`
              about-hero-body
              ${fonts.bricolage_grot400.className}
              text-[clamp(1rem,2.2vw,1.35rem)] min-[1500px]:text-[clamp(1rem,2.5vw,1.5rem)]
              leading-relaxed text-center min-[1500px]:text-left
            `}
          >
            {about.heroBody}
          </p>
        </div>

        {/* Scroll runway for mobile scrub — below copy, not between image and heading */}
        <div
          className="hidden max-[1499px]:block max-[767px]:h-[11svh] max-[767px]:min-h-20 min-[768px]:max-[1499px]:h-[9svh] min-[768px]:max-[1499px]:min-h-17 shrink-0"
          aria-hidden
        />
      </section>
    </section>
  )
}
