'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const FADE_MS = 500

/**
 * Soft-nav fade for all routes (including `/`).
 * Home hero sequences its SplitText intro after this fade so they do not fight.
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function sameOriginPath(href: string): { pathname: string; href: string } | null {
  try {
    const url = new URL(href, window.location.href)
    if (url.origin !== window.location.origin) return null
    return {
      pathname: url.pathname.replace(/\/$/, '') || '/',
      href: `${url.pathname}${url.search}${url.hash}`,
    }
  } catch {
    return null
  }
}

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname()
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement>(null)
  /** Path currently fading out — never apply fadeout to a newly mounted route. */
  const [exitingPathname, setExitingPathname] = useState<string | null>(null)
  const navigatingRef = useRef(false)
  const navGenRef = useRef(0)
  const pendingTimeoutRef = useRef<number | null>(null)
  const pendingElRef = useRef<HTMLDivElement | null>(null)
  const pendingOnEndRef = useRef<((e: AnimationEvent) => void) | null>(null)

  const clearPendingFinish = () => {
    if (pendingTimeoutRef.current !== null) {
      window.clearTimeout(pendingTimeoutRef.current)
      pendingTimeoutRef.current = null
    }
    const el = pendingElRef.current
    const onEnd = pendingOnEndRef.current
    if (el && onEnd) {
      el.removeEventListener('animationend', onEnd)
    }
    pendingElRef.current = null
    pendingOnEndRef.current = null
  }

  // Route settled: drop stale finish callbacks; hold lock through fade-in.
  useEffect(() => {
    clearPendingFinish()
    setExitingPathname(null)
    // Invalidate any in-flight finish from the previous navigation.
    navGenRef.current += 1

    if (prefersReducedMotion()) {
      navigatingRef.current = false
      return
    }

    navigatingRef.current = true
    const unlockId = window.setTimeout(() => {
      navigatingRef.current = false
    }, FADE_MS)

    return () => {
      window.clearTimeout(unlockId)
      clearPendingFinish()
    }
  }, [pathname])

  useEffect(() => {
    const onClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest('a')
      if (!anchor) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return
      const rawHref = anchor.getAttribute('href')
      if (!rawHref || rawHref.startsWith('#')) return

      const resolved = sameOriginPath(rawHref)
      if (!resolved) return

      // Hard lock: block Link default while a transition is in flight (incl. fade-in).
      if (navigatingRef.current) {
        event.preventDefault()
        return
      }

      const currentPath = pathname.replace(/\/$/, '') || '/'
      if (resolved.pathname === currentPath && !resolved.href.includes('?')) {
        // Same path, possibly hash-only — let the browser handle it.
        if (resolved.href.includes('#')) return
        return
      }

      // Soft-nav to a different internal page: fade out first.
      event.preventDefault()

      if (prefersReducedMotion()) {
        navigatingRef.current = true
        navGenRef.current += 1
        router.push(resolved.href)
        return
      }

      clearPendingFinish()
      navigatingRef.current = true
      const gen = ++navGenRef.current
      setExitingPathname(pathname)

      const el = wrapperRef.current
      let done = false
      const finish = () => {
        if (done) return
        if (gen !== navGenRef.current) return
        done = true
        clearPendingFinish()
        router.push(resolved.href)
      }
      const onEnd = (e: AnimationEvent) => {
        if (e.target !== el) return
        finish()
      }

      pendingElRef.current = el
      pendingOnEndRef.current = onEnd
      el?.addEventListener('animationend', onEnd)
      pendingTimeoutRef.current = window.setTimeout(finish, FADE_MS + 50)
    }

    document.addEventListener('click', onClickCapture, true)
    return () => {
      document.removeEventListener('click', onClickCapture, true)
      clearPendingFinish()
    }
  }, [pathname, router])

  const isExiting = exitingPathname === pathname

  // Inline opacity:0 on enter so the first paint never flashes full content
  // before animate-fadein applies.
  return (
    <div
      ref={wrapperRef}
      key={pathname}
      className={isExiting ? 'animate-fadeout' : 'animate-fadein'}
      style={isExiting ? undefined : { opacity: 0 }}
    >
      {children}
    </div>
  )
}

export default PageTransition
