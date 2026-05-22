'use client'

import gsap from "gsap"
import { ScrollSmoother } from "gsap/ScrollSmoother"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(ScrollSmoother, ScrollTrigger, useGSAP);

interface ScrollSmoothProps {
    children: React.ReactNode
}

const ScrollSmoothWrapper: React.FC<ScrollSmoothProps> = ({ children }) => {

    useGSAP(() => {
        ScrollTrigger.config({
            limitCallbacks: true,
            ignoreMobileResize: true,
        })

        const touchScroll = Boolean(ScrollTrigger.isTouch)
        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches

        const smoother = ScrollSmoother.create({
            wrapper: '#smooth-wrapper',
            content: '#smooth-content',
            smooth: reducedMotion || touchScroll ? 0 : 0.85,
            effects: false,
            smoothTouch: 0,
            normalizeScroll: false,
            ignoreMobileResize: true,
        })

        const saveScroll = () => {
            sessionStorage.setItem('lastScrollY', smoother.scrollTop().toString())
            sessionStorage.setItem('lastPath', window.location.pathname)
        }
        window.addEventListener('beforeunload', saveScroll)
        window.addEventListener('pagehide', saveScroll)

        // 2. Restoration Logic
        const savedPath = sessionStorage.getItem('lastPath')
        const savedY = sessionStorage.getItem('lastScrollY')
        const isReload = savedPath === window.location.pathname

        const revealContent = () => {
            gsap.set('#smooth-content', { visibility: 'visible' })
            gsap.to('#smooth-content', {
                autoAlpha: 1,
                duration: 0.2,
                onComplete: () => ScrollTrigger.refresh(),
            })
        }

        if (isReload && savedY) {
            smoother.scrollTop(parseFloat(savedY))
            requestAnimationFrame(() => {
                ScrollTrigger.refresh()
                requestAnimationFrame(revealContent)
            })
        } else {
            revealContent()
        }

        return () => {
            window.removeEventListener('beforeunload', saveScroll)
            window.removeEventListener('pagehide', saveScroll)
        }
    })

    return (
        <div id='smooth-wrapper' className="fixed inset-0 w-full h-full overflow-hidden p-0 m-0">
            {/* Start hidden to prevent the scroll jump flash */}
            <div id='smooth-content' style={{ visibility: 'hidden', opacity: 0 }}>
                {children}
            </div>
        </div>
    )
}

export default ScrollSmoothWrapper