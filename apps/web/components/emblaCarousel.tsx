import React, { useCallback, useEffect, useRef } from 'react'
import {
  EmblaCarouselType,
  EmblaEventType,
  EmblaOptionsType
} from 'embla-carousel'
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

// ─── Constants ────────────────────────────────────────────────────────────────

// Controls how aggressively slides shrink as they move away from center.
// Higher = faster shrink. Multiplied by snap count in setTweenFactor so the
// effect stays consistent regardless of how many slides there are.
const TWEEN_FACTOR_BASE = 0.2
const BASE_GAP = 40

// Clamps a number between min and max.
// Prevents scale from going below 0 (invisible) or above 1 (oversized).
const numberWithinRange = (number: number, min: number, max: number): number =>
  Math.min(Math.max(number, min), max)


// ─── Types ────────────────────────────────────────────────────────────────────

type PropType = {
  options?: EmblaOptionsType
  className_embla?: string
  className_emblaView?: string
  slides: Philosophy[]
  onInit?: (api: EmblaCarouselType) => void 
}


// ─── Component ────────────────────────────────────────────────────────────────

const EmblaCarousel = (props: PropType) => {
  const { slides, options, className_embla, className_emblaView, onInit } = props

  // emblaRef  → attached to the viewport DOM node so Embla can observe scrolling.
  // emblaApi  → the Embla instance exposing scrollSnapList(), on(), off(), etc.
  const [emblaRef, emblaApi] = useEmblaCarousel(options)

  // ─── Refs ──────────────────────────────────────────────────────────────────
  //
  // All animation state is stored in refs rather than React state.
  // Reason: tweenScale runs on every scroll frame. Using setState would trigger
  // a full React re-render on every frame, which is far too expensive.
  // Refs let us read/write values and directly mutate DOM styles without
  // ever involving React's render cycle.

  // The final tween multiplier (TWEEN_FACTOR_BASE × number of snaps).
  const tweenFactor = useRef(0)

  // The innermost elements (.embla__slide__number) — scale transform is applied here.
  // Kept separate from Embla's outer slide element so Embla's own layout
  // calculations are never affected by our scale transform.
  const tweenNodes = useRef<HTMLElement[]>([])

  // The middle wrapper elements (.embla__slide__margin) — margin compensation applied here.
  // This is intentionally a SEPARATE layer from both:
  //   1. The outer .embla__slide — which Embla controls via translateX for looping.
  //   2. The inner .embla__slide__number — which we're already using for scale transforms.
  const marginNodes = useRef<HTMLElement[]>([])

  // Cached slide widths measured once after init/reInit.
  // Replaces calling getBoundingClientRect() inside the scroll loop.
  const slideWidths = useRef<number[]>([])

  // ─── GSAP Layer Refs ───────────────────────────────────────────────────────
  //
  // Layer ownership summary:
  //   .embla__slide          → Embla    (translateX for loop teleportation)
  //   .embla__slide__margin  → tweenScale (margin compensation)
  //   .embla__slide__number  → tweenScale (scale transform)
  //   .embla__slide__gsap    → GSAP     (opacity, y, x, or any entrance animation)
  const gsapSlideRefs = useRef<(HTMLDivElement | null)[]>([])


  // ─── Dot & Arrow Buttons ───────────────────────────────────────────────────

  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(emblaApi)
  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick
  } = usePrevNextButtons(emblaApi)


  // ─── Click to Select Logic ─────────────────────────────────────────────────

  const onSlideClick = useCallback(
    (index: number) => {
      if (!emblaApi) return

      // To prevent jumping when a user finishes a drag/swipe, we check velocity.
      // If the carousel is stationary (or nearly so), we treat it as a selection click.
      const engine = emblaApi.internalEngine()
      const isStationary = Math.abs(engine.scrollBody.velocity()) < 0.1

      if (isStationary) {
        emblaApi.scrollTo(index)
      }
    },
    [emblaApi]
  )


  // ─── Tween Setup ──────────────────────────────────────────────────────────

  // Collects and caches all the DOM node references we need for animation.
  // Called on mount and on reInit because the DOM nodes may have changed.
  const setTweenNodes = useCallback((emblaApi: EmblaCarouselType): void => {
    const nodes = emblaApi.slideNodes()

    // Inner element: receives the scale transform.
    tweenNodes.current = nodes.map((slideNode) => {
      return slideNode.querySelector('.embla__slide__number') as HTMLElement
    })

    // Middle wrapper: receives the margin compensation.
    marginNodes.current = nodes.map((slideNode) => {
      return slideNode.querySelector('.embla__slide__margin') as HTMLElement
    })

    // Cache slide widths here — measured once, reused on every scroll frame.
    slideWidths.current = nodes.map((node) => node.getBoundingClientRect().width)
  }, [])

  // Computes the final tween multiplier.
  const setTweenFactor = useCallback((emblaApi: EmblaCarouselType) => {
    tweenFactor.current = TWEEN_FACTOR_BASE * emblaApi.scrollSnapList().length
  }, [])


  // ─── Scale + Margin Tween ─────────────────────────────────────────────────

  const tweenScale = useCallback(
    (emblaApi: EmblaCarouselType, eventName?: EmblaEventType) => {

      // internalEngine() is Embla's undocumented internal API.
      // Used here because slideRegistry and slideLooper.loopPoints are not
      // exposed via the public API, but are necessary for this implementation.
      const engine = emblaApi.internalEngine()
      const scrollProgress = emblaApi.scrollProgress()
      const slidesInView = emblaApi.slidesInView()
      const isScrollEvent = eventName === 'scroll'

      emblaApi.scrollSnapList().forEach((scrollSnap, snapIndex) => {

        // How far is this snap point from the current scroll position?
        let diffToTarget = scrollSnap - scrollProgress
        const slidesInSnap = engine.slideRegistry[snapIndex]

        slidesInSnap.forEach((slideIndex: number) => {

          // Skip off-screen slides during scroll — no point updating
          // transforms on slides the user can't see right now.
          if (isScrollEvent && !slidesInView.includes(slideIndex)) return

          // ── Loop Correction ──────────────────────────────────────────────
          // Corrects diffToTarget in the teleported slide's actual coordinate 
          // space so the scale looks correct during wrap-around.
          if (engine.options.loop) {
            engine.slideLooper.loopPoints.forEach((loopItem) => {
              const target = loopItem.target()

              if (slideIndex === loopItem.index && target !== 0) {
                const sign = Math.sign(target)

                if (sign === -1) {
                  diffToTarget = scrollSnap - (1 + scrollProgress)
                }

                if (sign === 1) {
                  diffToTarget = scrollSnap + (1 - scrollProgress)
                }
              }
            })
          }

          // ── Scale Calculation ────────────────────────────────────────────
          const tweenValue = 1 - Math.abs(diffToTarget * tweenFactor.current)
          const scaleNum = numberWithinRange(tweenValue, 0, 1)

          // ── Apply Scale ──────────────────────────────────────────────────
          const tweenNode = tweenNodes.current[slideIndex]
          if (tweenNode) {
            tweenNode.style.transform = `scale(${scaleNum})`
          }

          // ── Apply Margin Compensation ────────────────────────────────────
          // Scaling an element shrinks its visual size but NOT its layout size.
          // Fix: apply negative margins equal to the phantom space on each side.
          const marginNode = marginNodes.current[slideIndex]
          if (marginNode) {
            const slideWidth = slideWidths.current[slideIndex]
            // Full compensation on one side only.
            const compensation = ((1 - scaleNum) * slideWidth + BASE_GAP) * -1
            marginNode.style.marginRight = `${compensation}px`
            marginNode.style.marginLeft = '0px'
          }
        })
      })
    },
    []
  )


  // ─── Effect: Wire Up Embla Events ─────────────────────────────────────────

  useEffect(() => {
    if (!emblaApi) return
    onInit?.(emblaApi)
  }, [emblaApi, onInit])

  useEffect(() => {
    if (!emblaApi) return

    const REINIT: EmblaEventType = 'reInit'
    const SCROLL: EmblaEventType = 'scroll'
    const SLIDE_FOCUS: EmblaEventType = 'slideFocus'

    // Run setup immediately on mount
    setTweenNodes(emblaApi)
    setTweenFactor(emblaApi)
    tweenScale(emblaApi)

    emblaApi
      .on(REINIT, setTweenNodes)
      .on(REINIT, setTweenFactor)
      .on(REINIT, tweenScale)
      .on(SCROLL, tweenScale)
      .on(SLIDE_FOCUS, tweenScale)

    // Cleanup on unmount.
    return () => {
      emblaApi
        .off(REINIT, setTweenNodes)
        .off(REINIT, setTweenFactor)
        .off(REINIT, tweenScale)
        .off(SCROLL, tweenScale)
        .off(SLIDE_FOCUS, tweenScale)
    }
  }, [emblaApi, setTweenNodes, setTweenFactor, tweenScale])


  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={cn('embla w-full h-fit select-none @container', className_embla)}>

      <div className={cn(`embla__viewport overflow-hidden w-[95%] 2xl:w-full self-end `, className_emblaView)} ref={emblaRef}>

        <div className="embla__container h-full flex flex-row ">
          {slides.map((slide, index) => (

            // Outer slide: owned by Embla.
            // Added onClick and cursor-pointer for the select-on-click feature.
            <div
              className="embla__slide @container rounded-2xl aspect-4/5 sm:aspect-2.5/3 flex-[0_0_80%] sm:flex-[0_0_50%] lg:flex-[0_0_50%] xl:flex-[0_0_43%] min-w-0 cursor-pointer"
              key={index}
              onClick={() => onSlideClick(index)}
            >

              {/* Middle wrapper: receives margin compensation from tweenScale.
                  Sits between Embla's positioning layer and our scale layer. */}
              <div className="embla__slide__margin w-full h-full">

                {/* Scale layer: receives the scale transform from tweenScale.
                    Kept innermost so scaling never affects Embla's layout math. */}
                <div className="embla__slide__number w-full h-full">

                  {/* ── GSAP layer ─────────────────────────────────────────────
                      This is the ONLY element GSAP should animate.
                      Keeping layers isolated prevents transform/opacity collisions. */}
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