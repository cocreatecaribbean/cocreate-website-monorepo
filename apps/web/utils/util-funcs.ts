import type { SplitText } from 'gsap/SplitText'

/** Black → Chambray → Black, top-left to bottom-right */
export const TEXT_GRADIENT_CHAMBRAY_DIAGONAL =
  'linear-gradient(to bottom right, #000000 0%, #39419a 50%, #000000 100%)'

/**
 * Gradient on an INNER span so the outer SplitText word can still animate
 * opacity reliably (bg-clip + text-fill on the same node breaks opacity hide).
 */
export const splitTextGradient = (splitTextWords: SplitText) => {
  const totalWords = splitTextWords.words.length
  splitTextWords.words.forEach((word, i) => {
    const outer = word as HTMLElement
    outer.style.display = 'inline-block'

    const inner = document.createElement('span')
    while (outer.firstChild) {
      inner.appendChild(outer.firstChild)
    }
    outer.appendChild(inner)

    const progress = (i / totalWords) * 100
    inner.style.display = 'inline-block'
    inner.style.backgroundImage =
      'linear-gradient(to right, #39419a, #406eb5 40%, #f6b03f 75%)'
    inner.style.backgroundSize = `${totalWords * 100}% 100%`
    inner.style.backgroundPosition = `${progress}% 0`
    inner.style.setProperty('-webkit-background-clip', 'text')
    inner.style.backgroundClip = 'text'
    inner.style.setProperty('-webkit-text-fill-color', 'transparent')
  })
}

/**
 * Continuous block gradient across SplitText words (shared background sized to the
 * parent), so a diagonal wash reads as one surface instead of per-word strips.
 */
export const applySharedTextGradient = (
  splitTextWords: SplitText,
  gradient: string = TEXT_GRADIENT_CHAMBRAY_DIAGONAL,
) => {
  const words = splitTextWords.words as HTMLElement[]
  if (!words.length) return () => {}

  const container =
    (splitTextWords.elements?.[0] as HTMLElement | undefined) ??
    words[0].parentElement
  if (!container) return () => {}

  const ensureInners = () => {
    words.forEach((outer) => {
      let inner = outer.querySelector(
        ':scope > .text-gradient-fill',
      ) as HTMLElement | null
      if (inner) return

      inner = document.createElement('span')
      inner.className = 'text-gradient-fill'
      while (outer.firstChild) {
        inner.appendChild(outer.firstChild)
      }
      outer.appendChild(inner)
      outer.style.display = 'inline-block'
      inner.style.display = 'inline-block'
      inner.style.setProperty('-webkit-background-clip', 'text')
      inner.style.backgroundClip = 'text'
      inner.style.setProperty('-webkit-text-fill-color', 'transparent')
    })
  }

  const paint = () => {
    ensureInners()
    const bounds = container.getBoundingClientRect()
    if (bounds.width <= 0 || bounds.height <= 0) return

    words.forEach((outer) => {
      const inner = outer.querySelector(
        ':scope > .text-gradient-fill',
      ) as HTMLElement | null
      if (!inner) return
      const wordBounds = outer.getBoundingClientRect()
      inner.style.backgroundImage = gradient
      inner.style.backgroundSize = `${bounds.width}px ${bounds.height}px`
      inner.style.backgroundPosition = `${bounds.left - wordBounds.left}px ${bounds.top - wordBounds.top}px`
    })
  }

  paint()
  return paint
}
