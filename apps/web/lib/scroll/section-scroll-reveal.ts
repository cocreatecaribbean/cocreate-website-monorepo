import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

type SectionScrollRevealOptions = {
  trigger: HTMLElement
  onReveal: () => void
  onHide: () => void
  persistAfterReveal?: boolean
}

/**
 * ScrollTrigger section reveal tuned for ScrollSmoother + touch.
 * Default: bidirectional enter/leave.
 * With persistAfterReveal: reveal on enter and enter-back; stay visible when
 * scrolling past downward; hide only when scrolling back above the section top
 * (onLeaveBack). Init sync reveals when already past start (mid-page reload).
 */
export function bindSectionScrollReveal({
  trigger,
  onReveal,
  onHide,
  persistAfterReveal = false,
}: SectionScrollRevealOptions) {
  const start = ScrollTrigger.isTouch ? 'top 92%' : 'top 85%'

  const st = ScrollTrigger.create({
    trigger,
    start,
    end: 'bottom 12%',
    invalidateOnRefresh: true,
    onEnter: onReveal,
    ...(persistAfterReveal
      ? {
          onEnterBack: onReveal,
          onLeaveBack: onHide,
        }
      : {
          onEnterBack: onReveal,
          onLeave: onHide,
          onLeaveBack: onHide,
        }),
  })

  const syncIfInView = () => {
    // Persist: already past start (progress > 0 includes scrolled past end).
    // Default: only while the trigger is in the active window.
    const shouldShow = persistAfterReveal
      ? st.progress > 0 || st.isActive
      : st.isActive
    if (!shouldShow) return

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
