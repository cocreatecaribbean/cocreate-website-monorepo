'use client'

import { useLayoutEffect, useState } from "react"
import gsap from "gsap"
import { ScrollSmoother } from "gsap/ScrollSmoother"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { prefersNativeScroll } from "@/lib/scroll/native-scroll"

gsap.registerPlugin(ScrollSmoother, ScrollTrigger, useGSAP);

interface ScrollSmoothProps {
    children: React.ReactNode
}

const ScrollSmoothWrapper: React.FC<ScrollSmoothProps> = ({ children }) => {
    const [nativeScroll, setNativeScroll] = useState(false)

    useLayoutEffect(() => {
        setNativeScroll(prefersNativeScroll())
    }, [])

    useGSAP(() => {
        ScrollTrigger.config({
            limitCallbacks: true,
            ignoreMobileResize: true,
        })

        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches
        const useNative =
            nativeScroll ||
            prefersNativeScroll() ||
            Boolean(ScrollTrigger.isTouch) ||
            reducedMotion

        const revealContent = () => {
            gsap.set('#smooth-content', { visibility: 'visible', opacity: 1 })
            requestAnimationFrame(() => ScrollTrigger.refresh())
        }

        const saveScroll = () => {
            const y = useNative
                ? window.scrollY
                : ScrollSmoother.get()?.scrollTop() ?? window.scrollY
            sessionStorage.setItem('lastScrollY', y.toString())
            sessionStorage.setItem('lastPath', window.location.pathname)
        }

        window.addEventListener('beforeunload', saveScroll)
        window.addEventListener('pagehide', saveScroll)

        const savedPath = sessionStorage.getItem('lastPath')
        const savedY = sessionStorage.getItem('lastScrollY')
        const isReload = savedPath === window.location.pathname

        if (useNative) {
            if (isReload && savedY) {
                const y = parseFloat(savedY)
                if (Number.isFinite(y)) {
                    window.scrollTo(0, y)
                }
                requestAnimationFrame(() => {
                    ScrollTrigger.refresh()
                    revealContent()
                })
            } else {
                revealContent()
            }

            return () => {
                window.removeEventListener('beforeunload', saveScroll)
                window.removeEventListener('pagehide', saveScroll)
            }
        }

        const smoother = ScrollSmoother.create({
            wrapper: '#smooth-wrapper',
            content: '#smooth-content',
            smooth: reducedMotion ? 0 : 0.85,
            effects: false,
            smoothTouch: 0,
            normalizeScroll: false,
            ignoreMobileResize: true,
        })

        const revealSmootherContent = () => {
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
                requestAnimationFrame(revealSmootherContent)
            })
        } else {
            revealSmootherContent()
        }

        return () => {
            window.removeEventListener('beforeunload', saveScroll)
            window.removeEventListener('pagehide', saveScroll)
            smoother.kill()
        }
    }, { dependencies: [nativeScroll] })

    return (
        <div
            id="smooth-wrapper"
            suppressHydrationWarning
            className={
                nativeScroll
                    ? 'w-full min-h-svh'
                    : 'fixed inset-0 w-full h-full overflow-hidden p-0 m-0'
            }
        >
            <div
                id="smooth-content"
                style={
                    nativeScroll
                        ? { visibility: 'visible', opacity: 1 }
                        : { visibility: 'hidden', opacity: 0 }
                }
            >
                {children}
            </div>
        </div>
    )
}

export default ScrollSmoothWrapper
