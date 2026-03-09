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
import { philosophies } from '@/site-info/home-page-data'
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
}


// ─── Component ────────────────────────────────────────────────────────────────

const EmblaCarousel = (props: PropType) => {
  const { slides, options, className_embla, className_emblaView } = props

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
  //      If we put margins here, they conflict with Embla's loop teleportation and cause glitches.
  //   2. The inner .embla__slide__number — which we're already using for scale transforms.
  //      Mixing margin and scale transforms on the same element gets messy.
  // By using a dedicated middle wrapper, each layer has one responsibility.
  const marginNodes = useRef<HTMLElement[]>([])

  // Cached slide widths measured once after init/reInit.
  // Replaces calling getBoundingClientRect() inside the scroll loop.
  // getBoundingClientRect() forces a browser reflow (layout recalculation) every call.
  // Calling it inside a loop on every scroll frame causes significant jank.
  // Since slide width doesn't change during scrolling, we measure once and reuse.
  const slideWidths = useRef<number[]>([])


  // ─── Dot & Arrow Buttons ───────────────────────────────────────────────────

  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(emblaApi)
  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick
  } = usePrevNextButtons(emblaApi)


  // ─── Tween Setup ──────────────────────────────────────────────────────────

  // Collects and caches all the DOM node references we need for animation.
  // Called on mount and on reInit (slide count changes, window resize, etc.)
  // because the DOM nodes may have changed.
  //
  // useCallback with empty deps gives a stable function reference.
  // This is required because we pass this directly to emblaApi.on() and .off().
  // For .off() to successfully unregister, it must receive the exact same
  // function reference that was passed to .on(). Without useCallback, a new
  // function is created every render and .off() can never find it to remove it.
  const setTweenNodes = useCallback((emblaApi: EmblaCarouselType): void => {
    const nodes = emblaApi.slideNodes()

    // Inner element: receives the scale transform.
    tweenNodes.current = nodes.map((slideNode) => {
      return slideNode.querySelector('.embla__slide__number') as HTMLElement
    })

    // Middle wrapper: receives the margin compensation.
    // Sits between Embla's outer positioning element and our scale element,
    // so neither interferes with the other.
    marginNodes.current = nodes.map((slideNode) => {
      return slideNode.querySelector('.embla__slide__margin') as HTMLElement
    })

    // Cache slide widths here — measured once, reused on every scroll frame.
    // We measure the outer slide node (not the inner scaled one) because:
    //   - The outer node is never scaled, so getBoundingClientRect() returns
    //     the true layout width, not a scaled-down visual width.
    //   - This is the width we need for the margin compensation math.
    slideWidths.current = nodes.map((node) => node.getBoundingClientRect().width)
  }, [])

  // Computes the final tween multiplier.
  // Multiplying by snap count means the scale effect intensity stays visually
  // consistent whether there are 3 slides or 10 slides.
  const setTweenFactor = useCallback((emblaApi: EmblaCarouselType) => {
    tweenFactor.current = TWEEN_FACTOR_BASE * emblaApi.scrollSnapList().length
  }, [])


  // ─── Scale + Margin Tween ─────────────────────────────────────────────────

  // The core animation function. Runs on every scroll frame plus on init,
  // reInit, and slideFocus. For each slide it:
  //   1. Calculates how far the slide is from the current scroll position.
  //   2. Converts that distance into a scale value.
  //   3. Applies the scale transform to the inner element.
  //   4. Applies negative margin compensation to the middle wrapper so the
  //      visual gap between slides stays consistent despite the scaling.
  const tweenScale = useCallback(
    (emblaApi: EmblaCarouselType, eventName?: EmblaEventType) => {

      // internalEngine() is Embla's undocumented internal API.
      // Used here because slideRegistry and slideLooper.loopPoints are not
      // exposed via the public API, but are necessary for this implementation.
      const engine = emblaApi.internalEngine()

      // Normalized scroll position across the full scroll range (0 → 1).
      const scrollProgress = emblaApi.scrollProgress()

      // Indices of slides currently visible in the viewport.
      // Used below to skip off-screen slides during scroll events.
      const slidesInView = emblaApi.slidesInView()

      // During scroll events only, we skip off-screen slides for performance.
      // On other events (init, reInit, slideFocus) we update all slides.
      const isScrollEvent = eventName === 'scroll'

      emblaApi.scrollSnapList().forEach((scrollSnap, snapIndex) => {

        // How far is this snap point from the current scroll position?
        // 0 = carousel is exactly on this snap (slide is centered/active).
        // Growing away from 0 = slide is further away = should shrink more.
        let diffToTarget = scrollSnap - scrollProgress

        // slideRegistry is a 2D array: slideRegistry[snapIndex] = [slideIndex, ...]
        // Maps each snap stop to the slide(s) that belong to it.
        // Usually one slide per snap, but can be multiple with slidesToScroll > 1.
        const slidesInSnap = engine.slideRegistry[snapIndex]

        slidesInSnap.forEach((slideIndex: number) => {

          // Skip off-screen slides during scroll — no point updating
          // transforms on slides the user can't see right now.
          if (isScrollEvent && !slidesInView.includes(slideIndex)) return

          // ── Loop Correction ──────────────────────────────────────────────
          //
          // In loop mode, Embla repositions slides by applying CSS translateX
          // offsets of +1 or -1 in scroll-progress space (not pixels).
          // loopPoints tracks which slides have been repositioned and by how much.
          //
          // The problem: scrollSnap values are stored in their original (0→1)
          // positions. When a slide is teleported, its scrollSnap value doesn't
          // update — so diffToTarget becomes wildly wrong for that slide.
          //
          // Example: slide 0 has scrollSnap 0.0. It gets teleported to just
          // after slide 4 (loopPoint target = +1). If scrollProgress is 0.95,
          // diffToTarget = 0.0 - 0.95 = -0.95 → slide appears nearly invisible.
          // But visually it's right there on screen and should be scaling UP.
          //
          // The correction recalculates diffToTarget in the teleported slide's
          // actual coordinate space so the scale looks correct during wrap-around.
          if (engine.options.loop) {
            engine.slideLooper.loopPoints.forEach((loopItem) => {
              const target = loopItem.target()

              if (slideIndex === loopItem.index && target !== 0) {
                const sign = Math.sign(target)

                // target = -1: slide teleported BEFORE the start of the track.
                // Correct by shifting the reference frame back by 1 full loop length.
                if (sign === -1) {
                  diffToTarget = scrollSnap - (1 + scrollProgress)
                }

                // target = +1: slide teleported AFTER the end of the track.
                // Correct by shifting the reference frame forward by 1 full loop length.
                if (sign === 1) {
                  diffToTarget = scrollSnap + (1 - scrollProgress)
                }
              }
            })
          }

          // ── Scale Calculation ────────────────────────────────────────────
          //
          // tweenValue = 1 when diffToTarget is 0 (slide is centered → full size).
          // tweenValue shrinks as diffToTarget grows (slide moves away → shrinks).
          // Clamped to [0, 1] so scale is always a valid CSS value.
          const tweenValue = 1 - Math.abs(diffToTarget * tweenFactor.current)
          const scaleNum = numberWithinRange(tweenValue, 0, 1)

          // ── Apply Scale ──────────────────────────────────────────────────
          const tweenNode = tweenNodes.current[slideIndex]
          if (tweenNode) {
            tweenNode.style.transform = `scale(${scaleNum})`
          }

          // ── Apply Margin Compensation ────────────────────────────────────
          //
          // Scaling an element shrinks its visual size but NOT its layout size.
          // The slide still occupies its full width in the flex row, creating
          // "phantom space" around the shrunken content that makes gaps uneven.
          //
          // Fix: apply negative margins equal to the phantom space on each side.
          //
          // Math:
          //   total phantom space = (1 - scale) * slideWidth
          //   phantom space per side = total / 2  (scale is centered, so equal on both sides)
          //   negative margin = phantom space per side * -1  (pull neighbors IN, not push out)
          //
          //   simplified: ((1 - scaleNum) / 2) * slideWidth * -1
          //
          // We use the cached width (measured once in setTweenNodes) rather than
          // calling getBoundingClientRect() here, because getBoundingClientRect()
          // forces a browser reflow on every call. Inside a scroll loop that
          // runs every frame, this causes significant jank.
          //
          // Applied to the MIDDLE wrapper (.embla__slide__margin), not the outer
          // slide, because Embla controls the outer slide's transform for loop
          // teleportation. Putting margins on the same element Embla is moving
          // causes position conflicts and loop glitches.
          
          const marginNode = marginNodes.current[slideIndex]
          if (marginNode) {
            const slideWidth = slideWidths.current[slideIndex]
            // Full compensation on one side only.
            // The gap between slides A and B is now solely determined by A's marginRight,
            // not a combination of A's marginRight AND B's marginLeft.
            const compensation = ((1 - scaleNum) * slideWidth + BASE_GAP) * -1
            marginNode.style.marginRight = `${compensation}px`
            marginNode.style.marginLeft = '0px'
          }
        })
      })
    },
    // No dependencies — only reads from refs (not state/props), so this function
    // never needs to be recreated. Stable reference required for .on()/.off().
    []
  )


  // ─── Effect: Wire Up Embla Events ─────────────────────────────────────────

  useEffect(() => {
    if (!emblaApi) return

    const REINIT: EmblaEventType = 'reInit'
    const SCROLL: EmblaEventType = 'scroll'
    const SLIDE_FOCUS: EmblaEventType = 'slideFocus'

    // Run setup immediately on mount so the initial render is correct
    // before any user interaction occurs.
    setTweenNodes(emblaApi)
    setTweenFactor(emblaApi)
    tweenScale(emblaApi)

    emblaApi
      // reInit: fires when Embla reinitializes (slide count changes, resize, etc.)
      // Re-run all three setup functions because DOM nodes, widths, and snap
      // count may all have changed.
      .on(REINIT, setTweenNodes)
      .on(REINIT, setTweenFactor)
      .on(REINIT, tweenScale)
      // scroll: fires on every scroll frame. Update transforms to match position.
      .on(SCROLL, tweenScale)
      // slideFocus: fires on keyboard focus. Update transforms so the focused
      // slide scales up correctly even without any scroll happening.
      .on(SLIDE_FOCUS, tweenScale)

    // Cleanup on unmount or when emblaApi changes.
    // Removes all listeners to prevent memory leaks and stale callbacks.
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

        {/* gap-x-10 for consistent spacing between slides.
            Replaces the old pl-10 on each slide, which was asymmetric and
            caused Embla to miscalculate snap centers, making stops feel uneven. */}
        <div className="embla__container h-full flex flex-row ">
          {slides.map((slide, index) => (

            // Outer slide: owned by Embla. Do NOT apply margins or transforms here.
            // Embla uses translateX on this element for loop teleportation.
            // Any margins we add here conflict with Embla's positioning and cause glitches.
            <div className="embla__slide translate-x-72 @container rounded-2xl aspect-4/5 sm:aspect-2.5/3 flex-[0_0_80%] sm:flex-[0_0_50%] lg:flex-[0_0_50%] xl:flex-[0_0_43%] min-w-0" key={index}>

              {/* Middle wrapper: receives margin compensation from tweenScale.
                  Sits between Embla's positioning layer and our scale layer so
                  neither interferes with the other. One job: handle margins. */}
              <div className="embla__slide__margin w-full h-full ">

                {/* Inner element: receives the scale transform from tweenScale.
                    Kept innermost so scaling never affects Embla's layout math.
                    One job: handle scale. */}
                <div className=" embla__slide__number w-full h-full ">
                  <EmblaSlide 
                    name={slide.name}
                    info={slide.info}
                    bgImage={slide.bgImage}
                    icon={slide.icon}
                    position={slide.position}
                    isActive={index===selectedIndex}
                    />
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
              className={`embla__dot ${index === selectedIndex ? 'embla__dot--selected bg-casablanca' : 'bg-sanmarino'} w-3 h-3 rounded-full ring-2 ring-sanmarino ring-offset-2 hover:cursor-pointer transition-colors duration-200 `}
            />
          ))}
        </div>
      </div>

    </div>
  )
}

export default EmblaCarousel