import type { SplitText } from 'gsap/SplitText'

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
