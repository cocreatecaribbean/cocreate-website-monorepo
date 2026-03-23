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
        const smoother = ScrollSmoother.create({
            wrapper: '#smooth-wrapper',
            content: '#smooth-content',
            smooth: 1,
            effects: true,
            smoothTouch: false,
            normalizeScroll: false,
        })

        // 1. Capture scroll on reload/exit
        const handleUnload = () => {
            sessionStorage.setItem('lastScrollY', smoother.scrollTop().toString())
            sessionStorage.setItem('lastPath', window.location.pathname)
        }
        window.addEventListener('beforeunload', handleUnload)

        // 2. Restoration Logic
        const savedPath = sessionStorage.getItem('lastPath')
        const savedY = sessionStorage.getItem('lastScrollY')
        const isReload = savedPath === window.location.pathname

        if (isReload && savedY) {
            // Restore position BEFORE showing the content
            smoother.scrollTop(parseFloat(savedY))
            
            // Wait one tick for the jump to finish, then fade in
            requestAnimationFrame(() => {
                gsap.to('#smooth-content', { autoAlpha: 1, duration: 0.2 })
            })
        } else {
            // New page or no saved data: just show it immediately
            gsap.to('#smooth-content', { autoAlpha: 1, duration: 0.2 })
        }

        return () => {
            window.removeEventListener('beforeunload', handleUnload)
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