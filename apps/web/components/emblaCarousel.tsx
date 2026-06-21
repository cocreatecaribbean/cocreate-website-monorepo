import React, { useEffect, useRef } from 'react'
import { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import {
  NextButton,
  PrevButton,
  usePrevNextButtons
} from './emblaCarouselArrowButtons'
import { DotButton, useDotButton } from './emblaCarouselDotButton'
import EmblaSlide from './emblaSlide'
import { cn } from '@/utils/tailwind-helpers'
import { Philosophy } from '@/types/global-types'
import {
  useEmblaScaleTween,
  useEmblaStationarySlideClick,
} from '@/hooks/use-embla-scale-tween'

type PropType = {
  options?: EmblaOptionsType
  className_embla?: string
  className_emblaView?: string
  slides: Philosophy[]
  onInit?: (api: EmblaCarouselType) => void
}

const EmblaCarousel = (props: PropType) => {
  const { slides, options, className_embla, className_emblaView, onInit } = props

  const [emblaRef, emblaApi] = useEmblaCarousel(options)
  const gsapSlideRefs = useRef<(HTMLDivElement | null)[]>([])

  useEmblaScaleTween({ emblaApi })

  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(emblaApi)
  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick
  } = usePrevNextButtons(emblaApi)

  const onSlideClick = useEmblaStationarySlideClick(emblaApi)

  useEffect(() => {
    if (!emblaApi) return
    onInit?.(emblaApi)
  }, [emblaApi, onInit])

  return (
    <div className={cn('embla w-full h-fit select-none @container', className_embla)}>

      <div className={cn(`embla__viewport overflow-hidden w-[95%] 2xl:w-full self-end `, className_emblaView)} ref={emblaRef}>

        <div className="embla__container h-full flex flex-row ">
          {slides.map((slide, index) => (
            <div
              className="embla__slide @container rounded-2xl aspect-4/5 sm:aspect-2.5/3 flex-[0_0_80%] sm:flex-[0_0_50%] lg:flex-[0_0_50%] xl:flex-[0_0_43%] min-w-0 cursor-pointer"
              key={index}
              onClick={() => onSlideClick(index)}
            >
              <div className="embla__slide__margin w-full h-full">
                <div className="embla__slide__number w-full h-full">
                  <div
                    className="embla__slide__gsap w-full h-full"
                    ref={(el) => { gsapSlideRefs.current[index] = el }}
                  >
                    <EmblaSlide
                      name={slide.name}
                      info={slide.info}
                      bgImage={slide.bgImage}
                      icon={slide.icon}
                      position={slide.position}
                      isActive={index === selectedIndex}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="embla__controls self-center flex flex-col items-center gap-y-8 ">
        <div className="embla__buttons flex flex-row gap-x-10">
          <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
          <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
        </div>

        <div className="embla__dots flex flex-row gap-x-4">
          {scrollSnaps.map((_, index) => (
            <DotButton
              key={index}
              onClick={() => onDotButtonClick(index)}
              className={cn(
                "embla__dot w-3 rounded-full hover:cursor-pointer transition-all duration-200",
                index === selectedIndex ? "bg-casablanca h-6" : "bg-sanmarino h-3"
              )}
            />
          ))}
        </div>
      </div>

    </div>
  )
}

export default EmblaCarousel
