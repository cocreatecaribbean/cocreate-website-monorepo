import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

type SectionScrollRevealOptions = {
  trigger: HTMLElement
  onReveal: () => void
  onHide: () => void
}

/**
 * Bidirectional enter/leave ScrollTrigger tuned for ScrollSmoother + touch.
 */
export function bindSectionScrollReveal({
  trigger,
  onReveal,
  onHide,
}: SectionScrollRevealOptions) {
  const start = ScrollTrigger.isTouch ? 'top 92%' : 'top 85%'

  const st = ScrollTrigger.create({
    trigger,
    start,
    end: 'bottom 12%',
    invalidateOnRefresh: true,
    onEnter: onReveal,
    onEnterBack: onReveal,
    onLeave: onHide,
    onLeaveBack: onHide,
  })

  const syncIfInView = () => {
    if (st.isActive) onReveal()
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ScrollTrigger.refresh(true)
      syncIfInView()
    })
  })

  return st
}

/** Keep layout space while GSAP owns opacity/visibility */
export function primeScrollRevealTargets(
  elements: gsap.TweenTarget,
  hidden: gsap.TweenVars,
) {
  gsap.set(elements, { ...hidden, visibility: 'visible' })
}
