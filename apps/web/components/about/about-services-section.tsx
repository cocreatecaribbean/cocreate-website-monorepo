'use client'

import { useRef } from 'react'
import Image from 'next/image'
import * as fonts from '@/styles/fonts'
import { useAboutServicesAnimation } from '@/hooks/use-about-services-animation'
import { aboutServices, aboutServicesSection } from '@/site-info/about-page-data'

const BRAND_ELEM_SRC = '/bg-brand-elem.png'

function BrandDecor({ corner }: { corner: 'top-right' | 'bottom-left' }) {
  const isTopRight = corner === 'top-right'

  return (
    <div
      data-about-services-decor
      aria-hidden
      className={`
        pointer-events-none absolute z-0
        ${
          isTopRight
            ? `
              -top-[14%] -right-[11%]
              min-[768px]:max-[1023px]:-top-[28%] min-[768px]:max-[1023px]:-right-[12%]
              min-[1024px]:-top-[18%] min-[1024px]:-right-[21%]
            `
            : `
              -bottom-[16%] -left-[11%]
              min-[768px]:max-[1023px]:-bottom-[30%] min-[768px]:max-[1023px]:-left-[12%]
              min-[1024px]:-bottom-[34%] min-[1024px]:-left-[15%]
            `
        }
      `}
    >
      <div
        data-about-services-decor-float
        className={isTopRight ? 'rotate-[-110deg]' : 'rotate-228'}
      >
        <Image
          src={BRAND_ELEM_SRC}
          alt=""
          width={720}
          height={720}
          className="
            h-auto w-[min(58vw,20rem)]
            min-[768px]:max-[1023px]:w-[24rem]
            min-[1024px]:w-md min-[1500px]:w-lg
            opacity-[0.68] min-[1024px]:opacity-[0.72]
          "
          aria-hidden
        />
      </div>
    </div>
  )
}

export default function AboutServicesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  useAboutServicesAnimation({ scope: sectionRef })

  return (
    <section
      ref={sectionRef}
      aria-labelledby="about-services-heading"
      className="
        about-services-section
        w-[86svw] max-w-[1080px] min-[1500px]:max-w-[1180px] mx-auto
        px-0 sm:px-1
        max-[767px]:-mt-8 min-[768px]:max-[1499px]:-mt-10
        mb-20 min-[1024px]:mb-32 min-[1500px]:mb-40
      "
    >
      <h2
        id="about-services-heading"
        data-about-services-heading
        className={`
          opacity-0
          ${fonts.bricolage_grot600.className}
          mb-8 min-[1024px]:mb-10
          text-center leading-none text-neutral-800
          text-[clamp(1.75rem,4vw,2.5rem)] min-[1024px]:text-[clamp(2rem,3vw,2.75rem)]
        `}
      >
        {aboutServicesSection.title}
      </h2>

      <div
        data-about-services-panel
        className="
          opacity-0 relative overflow-hidden
          rounded-[2.25rem] sm:rounded-[2.75rem] min-[1024px]:rounded-[5rem] min-[1500px]:rounded-[6rem]
          bg-[#f2f2f2]
          px-6 py-12
          sm:px-8
          min-[768px]:max-[1023px]:px-10 min-[768px]:max-[1023px]:py-16
          min-[1024px]:px-12 min-[1024px]:py-28
          min-[1500px]:px-16 min-[1500px]:py-34
        "
      >
        <BrandDecor corner="top-right" />
        <BrandDecor corner="bottom-left" />

        <ul
          className="
            relative z-10 grid grid-cols-1 gap-y-11 gap-x-6
            min-[768px]:grid-cols-2 min-[768px]:gap-y-12 min-[768px]:gap-x-8
            min-[1024px]:grid-cols-3 min-[1024px]:gap-y-24 min-[1024px]:gap-x-9
            min-[1500px]:gap-y-28 min-[1500px]:gap-x-10
          "
        >
          {aboutServices.map((service) => (
            <li
              key={service.title}
              data-about-services-item
              className="flex flex-col items-center text-center opacity-0"
            >
              <div data-about-services-icon className="mb-2.5 min-[1024px]:mb-3">
                <Image
                  src={service.iconSrc}
                  alt=""
                  width={140}
                  height={140}
                  className="h-16 w-16 sm:h-18 sm:w-18 min-[1024px]:h-20 min-[1024px]:w-20"
                  aria-hidden
                />
              </div>
              <h3
                className={`
                  ${fonts.bricolage_grot700.className}
                  mb-3 text-xl text-neutral-800
                  sm:text-[1.35rem] min-[1024px]:mb-3.5 min-[1024px]:text-[1.5rem]
                `}
              >
                {service.title}
              </h3>
              <p
                className={`
                  ${fonts.bricolage_grot400.className}
                  max-w-[16rem] text-sm leading-relaxed text-neutral-600
                  sm:max-w-70 sm:text-[0.95rem]
                  min-[768px]:max-w-58
                  min-[1024px]:max-w-60 min-[1024px]:text-base min-[1024px]:leading-relaxed
                `}
              >
                {service.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
