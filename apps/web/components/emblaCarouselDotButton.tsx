import React, {
  ComponentPropsWithRef,
  useCallback,
  useEffect,
  useState
} from 'react'
import { EmblaCarouselType, EmblaEventType } from 'embla-carousel'

type UseDotButtonType = {
  selectedIndex: number
  scrollSnaps: number[]
  onDotButtonClick: (index: number) => void
}

/**
 * Hook to manage dot button logic for Embla Carousel v8+
 */
export const useDotButton = (
  emblaApi: EmblaCarouselType | undefined
): UseDotButtonType => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const onDotButtonClick = useCallback(
    (index: number) => {
      if (!emblaApi) return
      emblaApi.scrollTo(index)
    },
    [emblaApi]
  )

  const onInit = useCallback((emblaApi: EmblaCarouselType) => {
    setScrollSnaps(emblaApi.scrollSnapList())
  }, [])

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    // Define event types clearly to satisfy TS union types
    const REINIT: EmblaEventType = 'reInit'
    const SELECT: EmblaEventType = 'select'

    // Initial state setup
    onInit(emblaApi)
    onSelect(emblaApi)

    // Register listeners
    emblaApi
      .on(REINIT, onInit)
      .on(REINIT, onSelect)
      .on(SELECT, onSelect)

    // Cleanup: crucial for preventing duplicate listeners on re-renders
    return () => {
      emblaApi
        .off(REINIT, onInit)
        .off(REINIT, onSelect)
        .off(SELECT, onSelect)
    }
  }, [emblaApi, onInit, onSelect])

  return {
    selectedIndex,
    scrollSnaps,
    onDotButtonClick
  }
}

/**
 * Atomic Dot Button component
 */
type PropType = ComponentPropsWithRef<'button'>

export const DotButton: React.FC<PropType> = ({ children, ...restProps }) => {
  return (
    <button type="button" {...restProps}>
      {children}
    </button>
  )
}