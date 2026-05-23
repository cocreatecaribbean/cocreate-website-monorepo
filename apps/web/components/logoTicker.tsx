'use client'

import { useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ClientLogo } from '@/types/global-types'

interface Props {
  logos: ClientLogo[]
}

const LogoTicker: React.FC<Props> = ({ logos }) => {
  const container = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!container.current) return

    // Move the track by exactly 50%
    // This works because the track is Set A + Set B
    gsap.to(".ticker-track", {
      xPercent: -50,
      repeat: -1,
      duration: 30,
      ease: "none",
    })
  }, { scope: container })

  return (
    <div ref={container} className="w-full overflow-hidden bg-white">
      {/* TICKER-TRACK:
        - w-fit is CRITICAL. It ensures the '50%' is exactly the width of one set of logos.
        - flex-nowrap prevents logos from dropping to a second line.
      */}
      <div className="ticker-track flex w-fit flex-nowrap gap-x-0 pr-0 opacity-60 md:gap-x-10 md:pr-10">
        {/* We render the list twice */}
        {[...logos, ...logos].map((logo, index) => (
          <div 
            key={index} 
            className="relative flex-none h-[120px] w-[180px] before:absolute before:top-[25%] before:left-0 before:block before:h-[50%] before:w-px before:bg-black/10 before:content-[''] md:h-[200px] md:w-[300px]"
          >
            <Image 
              src={logo.src} 
              alt={logo.alt} 
              fill
              className="object-contain grayscale"
              sizes="(max-width: 767px) 180px, 300px"
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default LogoTicker