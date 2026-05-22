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
    if (!st.isActive) return

    const content = document.getElementById('smooth-content')
    const contentOpacity = content
      ? (gsap.getProperty(content, 'opacity') as number)
      : 1

    // Wait for ScrollSmoother app reveal so section GSAP does not stack on the same beat (mobile /work)
    if (contentOpacity < 0.99) {
      gsap.delayedCall(0.2, syncIfInView)
      return
    }

    onReveal()
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
