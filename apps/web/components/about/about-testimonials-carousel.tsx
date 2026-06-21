'use client'

import useEmblaCarousel from 'embla-carousel-react'
import type { EmblaOptionsType } from 'embla-carousel'
import {
  NextButton,
  PrevButton,
  usePrevNextButtons,
} from '@/components/emblaCarouselArrowButtons'
import { DotButton, useDotButton } from '@/components/emblaCarouselDotButton'
import TestimonialChatCard from '@/components/about/testimonial-chat-card'
import {
  useEmblaScaleTween,
  useEmblaStationarySlideClick,
} from '@/hooks/use-embla-scale-tween'
import type { AboutTestimonial } from '@/types/about-testimonial'
import { cn } from '@/utils/tailwind-helpers'

const OPTIONS: EmblaOptionsType = {
  align: 'center',
  loop: true,
  containScroll: false,
}

type AboutTestimonialsCarouselProps = {
  testimonials: AboutTestimonial[]
}

export default function AboutTestimonialsCarousel({
  testimonials,
}: AboutTestimonialsCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(OPTIONS)

  useEmblaScaleTween({
    emblaApi,
    tweenFactorBase: 0.22,
    minScale: 0.92,
    applyOpacity: true,
    minOpacity: 0.42,
    applyMarginCompensation: false,
  })

  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(emblaApi)
  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi)
  const onSlideClick = useEmblaStationarySlideClick(emblaApi)

  return (
    <div className="embla w-full select-none @container">
      <div className="relative mx-auto w-full max-w-[1180px]">
        <div
          className="
            embla__viewport h-[320px] w-full overflow-hidden sm:h-[340px]
            [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]
            [-webkit-mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]
          "
          ref={emblaRef}
        >
        <div className="embla__container flex h-full touch-pan-y">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="
                embla__slide h-full min-w-0 flex-[0_0_85%] cursor-pointer
                sm:flex-[0_0_58%] lg:flex-[0_0_46%] xl:flex-[0_0_42%]
              "
              onClick={() => onSlideClick(index)}
            >
              <div className="embla__slide__margin flex h-full w-full items-end px-2 sm:px-3">
                <div className="embla__slide__number h-full w-full origin-bottom will-change-[transform,opacity]">
                  <TestimonialChatCard testimonial={testimonial} />
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>

      <div className="embla__controls mt-8 flex flex-col items-center gap-y-6">
        <div className="embla__buttons flex flex-row gap-x-8">
          <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
          <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
        </div>

        <div className="embla__dots flex h-6 flex-row items-center gap-x-3">
          {scrollSnaps.map((_, index) => (
            <DotButton
              key={index}
              onClick={() => onDotButtonClick(index)}
              className={cn(
                'embla__dot h-3 rounded-full transition-all duration-200 hover:cursor-pointer',
                index === selectedIndex
                  ? 'w-6 bg-casablanca'
                  : 'w-3 bg-sanmarino/70',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
