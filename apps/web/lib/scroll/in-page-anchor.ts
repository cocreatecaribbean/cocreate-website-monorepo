import { ScrollSmoother } from 'gsap/ScrollSmoother'

const SCROLL_OFFSET = 'top 7rem'

export function scrollToInPageTarget(id: string): boolean {
  if (typeof document === 'undefined') return false

  const target = document.getElementById(id)
  if (!target) return false

  const smoother = ScrollSmoother.get()
  if (smoother) {
    smoother.scrollTo(target, true, SCROLL_OFFSET)
  } else {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const hash = `#${id}`
  if (window.location.hash !== hash) {
    history.replaceState(null, '', hash)
  }

  return true
}

export function scrollToInPageHashFromLocation(): void {
  if (typeof window === 'undefined') return

  const hash = window.location.hash
  if (!hash.startsWith('#') || hash.length < 2) return

  const id = hash.slice(1)

  const attempt = (triesLeft: number) => {
    const scrolled = scrollToInPageTarget(id)
    if (!scrolled && triesLeft > 0) {
      requestAnimationFrame(() => attempt(triesLeft - 1))
    }
  }

  requestAnimationFrame(() => attempt(8))
}
