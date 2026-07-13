'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { EmblaCarouselType, EmblaEventType } from 'embla-carousel'

const numberWithinRange = (number: number, min: number, max: number): number =>
  Math.min(Math.max(number, min), max)

export type UseEmblaScaleTweenOptions = {
  emblaApi: EmblaCarouselType | undefined
  tweenFactorBase?: number
  baseGap?: number
  minScale?: number
  applyOpacity?: boolean
  minOpacity?: number
  disableScale?: boolean
  applyMarginCompensation?: boolean
}

export function useEmblaScaleTween({
  emblaApi,
  tweenFactorBase = 0.2,
  baseGap = 40,
  minScale = 0,
  applyOpacity = false,
  minOpacity = 0.48,
  disableScale = false,
  applyMarginCompensation = true,
}: UseEmblaScaleTweenOptions) {
  const tweenFactor = useRef(0)
  const tweenNodes = useRef<HTMLElement[]>([])
  const marginNodes = useRef<HTMLElement[]>([])
  const slideWidths = useRef<number[]>([])
  const reducedMotionRef = useRef(false)

  const setTweenNodes = useCallback((api: EmblaCarouselType): void => {
    const nodes = api.slideNodes()
    tweenNodes.current = nodes.map(
      (slideNode) => slideNode.querySelector('.embla__slide__number') as HTMLElement,
    )
    marginNodes.current = nodes.map(
      (slideNode) => slideNode.querySelector('.embla__slide__margin') as HTMLElement,
    )
    slideWidths.current = nodes.map((node) => node.getBoundingClientRect().width)
  }, [])

  const setTweenFactor = useCallback(
    (api: EmblaCarouselType) => {
      tweenFactor.current = tweenFactorBase * api.scrollSnapList().length
    },
    [tweenFactorBase],
  )

  const applyFlatState = useCallback((api: EmblaCarouselType) => {
    api.slideNodes().forEach((_, slideIndex) => {
      const tweenNode = tweenNodes.current[slideIndex]
      if (tweenNode) {
        tweenNode.style.transform = 'scale(1)'
        if (applyOpacity) tweenNode.style.opacity = '1'
      }
      const marginNode = marginNodes.current[slideIndex]
      if (marginNode) {
        marginNode.style.marginRight = '0px'
        marginNode.style.marginLeft = '0px'
      }
    })
  }, [applyOpacity])

  const tweenScale = useCallback(
    (api: EmblaCarouselType, eventName?: EmblaEventType) => {
      if (reducedMotionRef.current) {
        applyFlatState(api)
        return
      }

      const engine = api.internalEngine()
      const scrollProgress = api.scrollProgress()
      const slidesInView = api.slidesInView()
      const isScrollEvent = eventName === 'scroll'

      api.scrollSnapList().forEach((scrollSnap, snapIndex) => {
        let diffToTarget = scrollSnap - scrollProgress
        const slidesInSnap = engine.slideRegistry[snapIndex]

        slidesInSnap.forEach((slideIndex: number) => {
          if (isScrollEvent && !slidesInView.includes(slideIndex)) return

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

          const tweenValue = 1 - Math.abs(diffToTarget * tweenFactor.current)
          const scaleNum = disableScale
            ? 1
            : numberWithinRange(tweenValue, minScale, 1)
          const focus = numberWithinRange(tweenValue, 0, 1)

          const tweenNode = tweenNodes.current[slideIndex]
          if (tweenNode) {
            tweenNode.style.transform = `scale(${scaleNum})`
            if (applyOpacity) {
              const focusValue = disableScale ? focus : scaleNum
              const opacity = minOpacity + (1 - minOpacity) * focusValue
              tweenNode.style.opacity = String(numberWithinRange(opacity, minOpacity, 1))
            }
          }

          const marginNode = marginNodes.current[slideIndex]
          if (marginNode && applyMarginCompensation) {
            const slideWidth = slideWidths.current[slideIndex]
            const compensation = ((1 - scaleNum) * slideWidth + baseGap) * -1
            marginNode.style.marginRight = `${compensation}px`
            marginNode.style.marginLeft = '0px'
          }
        })
      })
    },
    [applyFlatState, applyOpacity, applyMarginCompensation, baseGap, disableScale, minOpacity, minScale],
  )

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    const REINIT: EmblaEventType = 'reInit'
    const SCROLL: EmblaEventType = 'scroll'
    const SLIDE_FOCUS: EmblaEventType = 'slideFocus'

    setTweenNodes(emblaApi)
    setTweenFactor(emblaApi)
    tweenScale(emblaApi)

    emblaApi
      .on(REINIT, setTweenNodes)
      .on(REINIT, setTweenFactor)
      .on(REINIT, tweenScale)
      .on(SCROLL, tweenScale)
      .on(SLIDE_FOCUS, tweenScale)

    return () => {
      emblaApi
        .off(REINIT, setTweenNodes)
        .off(REINIT, setTweenFactor)
        .off(REINIT, tweenScale)
        .off(SCROLL, tweenScale)
        .off(SLIDE_FOCUS, tweenScale)
    }
  }, [emblaApi, setTweenFactor, setTweenNodes, tweenScale])
}

/** Embla's public types omit the runtime `direction` arg used by scrollNext/scrollPrev. */
type EmblaScrollToWithDirection = (
  index: number,
  jump?: boolean,
  direction?: number,
) => void

export function useEmblaStationarySlideClick(emblaApi: EmblaCarouselType | undefined) {
  return useCallback(
    (index: number) => {
      if (!emblaApi) return
      if (emblaApi.selectedScrollSnap() === index) return
      const engine = emblaApi.internalEngine()
      const isStationary = Math.abs(engine.scrollBody.velocity()) < 0.1
      if (isStationary) {
        // Prefer forward (content left), same direction as scrollNext — avoids
        // shortest-path reverse when loop clones put a later slide visually right.
        ;(emblaApi.scrollTo as EmblaScrollToWithDirection)(index, false, -1)
      }
    },
    [emblaApi],
  )
}
