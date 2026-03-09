import React, {
    ComponentPropsWithRef,
    useCallback,
    useEffect,
    useState
  } from 'react'
  import { EmblaCarouselType, EmblaEventType } from 'embla-carousel'
  
  type UsePrevNextButtonsType = {
    prevBtnDisabled: boolean
    nextBtnDisabled: boolean
    onPrevButtonClick: () => void
    onNextButtonClick: () => void
  }
  
  export const usePrevNextButtons = (
    emblaApi: EmblaCarouselType | undefined
  ): UsePrevNextButtonsType => {
    const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
    const [nextBtnDisabled, setNextBtnDisabled] = useState(true)
  
    const onPrevButtonClick = useCallback(() => {
      if (!emblaApi) return
      // FIX: goToPrev -> scrollPrev
      emblaApi.scrollPrev()
    }, [emblaApi])
  
    const onNextButtonClick = useCallback(() => {
      if (!emblaApi) return
      // FIX: goToNext -> scrollNext
      emblaApi.scrollNext()
    }, [emblaApi])
  
    const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
      // FIX: canGoToPrev -> canScrollPrev
      setPrevBtnDisabled(!emblaApi.canScrollPrev())
      // FIX: canGoToNext -> canScrollNext
      setNextBtnDisabled(!emblaApi.canScrollNext())
    }, [])
  
    useEffect(() => {
      if (!emblaApi) return
  
      // Typed constants to prevent the "Argument not assignable" error
      const REINIT: EmblaEventType = 'reInit'
      const SELECT: EmblaEventType = 'select'
  
      onSelect(emblaApi)
      
      emblaApi.on(REINIT, onSelect).on(SELECT, onSelect)
  
      // CLEANUP: Removes listeners if component unmounts
      return () => {
        emblaApi.off(REINIT, onSelect).off(SELECT, onSelect)
      }
    }, [emblaApi, onSelect])
  
    return {
      prevBtnDisabled,
      nextBtnDisabled,
      onPrevButtonClick,
      onNextButtonClick
    }
  }
  
  type PropType = ComponentPropsWithRef<'button'>
  
  export const PrevButton: React.FC<PropType> = (props) => {
    const { children, disabled, ...restProps } = props
  
    return (
      <button
        className={`embla__button embla__button--prev hover:cursor-pointer ${
          disabled ? 'embla__button--disabled' : ''
        }`}
        type="button"
        disabled={disabled}
        {...restProps}
      >
        <svg className="embla__button__svg w-[2em] h-[2em] fill-sanmarino hover:fill-casablanca transition-colors duration-200" viewBox="0 0 532 532" >
          <path
            // fill="gray"
            d="M355.66 11.354c13.793-13.805 36.208-13.805 50.001 0 13.785 13.804 13.785 36.238 0 50.034L201.22 266l204.442 204.61c13.785 13.805 13.785 36.239 0 50.044-13.793 13.796-36.208 13.796-50.002 0a5994246.277 5994246.277 0 0 0-229.332-229.454 35.065 35.065 0 0 1-10.326-25.126c0-9.2 3.393-18.26 10.326-25.2C172.192 194.973 332.731 34.31 355.66 11.354Z"
          />
        </svg>
        {children}
      </button>
    )
  }
  
  export const NextButton: React.FC<PropType> = (props) => {
    const { children, disabled, ...restProps } = props
  
    return (
      <button
        className={`embla__button embla__button--next hover:cursor-pointer ${
          disabled ? 'embla__button--disabled' : ''
        }`}
        type="button"
        disabled={disabled}
        {...restProps}
      >
        <svg className="embla__button__svg w-[2em] h-[2em] fill-sanmarino hover:fill-casablanca transition-colors duration-200" viewBox="0 0 532 532">
          <path
            // fill="currentColor"
            d="M176.34 520.646c-13.793 13.805-36.208 13.805-50.001 0-13.785-13.804-13.785-36.238 0-50.034L330.78 266 126.34 61.391c-13.785-13.805-13.785-36.239 0-50.044 13.793-13.796 36.208-13.796 50.002 0 22.928 22.947 206.395 206.507 229.332 229.454a35.065 35.065 0 0 1 10.326 25.126c0 9.2-3.393 18.26-10.326 25.2-45.865 45.901-206.404 206.564-229.332 229.52Z"
          />
        </svg>
        {children}
      </button>
    )
  }