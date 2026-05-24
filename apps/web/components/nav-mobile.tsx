'use client'

import { menu_names, getMenuLabel, clientPortalNav } from '@/site-info/global-site-info'
import logo from '@/public/co_create_logo_hor_blue.svg'
import Image from 'next/image'
import Link from 'next/link'
import * as fonts from '@/styles/fonts'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search } from 'lucide-react'
import { useSearch } from '@/components/search/search-provider'
import { useClientPortalLogin } from '@/components/client-portal/client-portal-provider'
import gsap from 'gsap'

const PANEL_OPEN_DURATION = 0.72
const PANEL_CLOSE_DURATION = 0.4
const ITEM_STAGGER = 0.08
const MENU_GAP_PX = 12

const NavMobile: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [panelAlive, setPanelAlive] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [menuTop, setMenuTop] = useState(0)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const pathname = usePathname()
  const { openSearch, closeSearch } = useSearch()
  const { isOpen: isClientPortalOpen, openClientPortalLogin, closeClientPortalLogin } =
    useClientPortalLogin()
  const headerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<(HTMLDivElement | null)[]>([])
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const hasOpenedRef = useRef(false)

  const measureMenuTop = useCallback(() => {
    const header = headerRef.current
    if (!header) return
    setMenuTop(header.getBoundingClientRect().bottom + MENU_GAP_PX)
  }, [])

  const handleOpenSearch = () => {
    setIsOpen(false)
    openSearch()
  }

  const handleOpenClientPortal = () => {
    setIsOpen(false)
    closeSearch()
    openClientPortalLogin()
  }

  const handleToggleMenu = () => {
    if (isOpen) {
      setIsOpen(false)
      return
    }
    measureMenuTop()
    setPanelAlive(true)
    setIsOpen(true)
  }

  useEffect(() => {
    setMounted(true)
    const mq = window.matchMedia('(max-width: 767px)')
    const syncViewport = () => {
      const mobile = mq.matches
      setIsMobileViewport(mobile)
      if (!mobile) {
        setIsOpen(false)
        setPanelAlive(false)
      }
    }
    syncViewport()
    mq.addEventListener('change', syncViewport)
    return () => mq.removeEventListener('change', syncViewport)
  }, [])

  useEffect(() => {
    document.documentElement.style.overflow = isOpen ? 'hidden' : ''
    document.body.classList.toggle('menu-open', isOpen)
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isOpen) return
    measureMenuTop()
    window.addEventListener('resize', measureMenuTop)
    return () => window.removeEventListener('resize', measureMenuTop)
  }, [isOpen, measureMenuTop])

  useLayoutEffect(() => {
    const backdrop = backdropRef.current
    const items = itemsRef.current.filter(Boolean) as HTMLDivElement[]
    if (!backdrop || !panelAlive) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    timelineRef.current?.kill()

    if (prefersReducedMotion) {
      gsap.set(backdrop, {
        opacity: isOpen ? 1 : 0,
        scale: 1,
        y: 0,
        clipPath: 'inset(0% 0% 0% 0% round 2rem)',
      })
      gsap.set(items, { opacity: 1, y: 0, filter: 'blur(0px)' })
      if (!isOpen) setPanelAlive(false)
      return
    }

    if (isOpen) {
      hasOpenedRef.current = true
      gsap.set(backdrop, { pointerEvents: 'none', force3D: true })
      gsap.set(items, { opacity: 0, y: 36, filter: 'blur(10px)', force3D: true })

      timelineRef.current = gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        .fromTo(
          backdrop,
          {
            opacity: 0,
            scale: 0.9,
            y: -18,
            clipPath: 'inset(0% 5% 100% 5% round 2rem)',
            transformOrigin: 'top center',
          },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            clipPath: 'inset(0% 0% 0% 0% round 2rem)',
            duration: PANEL_OPEN_DURATION,
            ease: 'expo.out',
          },
        )
        .to(
          items,
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.62,
            stagger: ITEM_STAGGER,
            ease: 'power3.out',
          },
          `-=${PANEL_OPEN_DURATION * 0.55}`,
        )
    } else if (hasOpenedRef.current) {
      gsap.set(backdrop, { clipPath: 'inset(0% 0% 0% 0% round 2rem)' })

      timelineRef.current = gsap
        .timeline({
          defaults: { ease: 'power2.inOut' },
          onComplete: () => {
            gsap.set(backdrop, {
              opacity: 0,
              scale: 1,
              y: 0,
              clipPath: 'inset(0% 0% 0% 0% round 2rem)',
            })
            gsap.set(items, { opacity: 0, y: 0, filter: 'blur(0px)' })
            setPanelAlive(false)
          },
        })
        .to(items, {
          opacity: 0,
          y: 14,
          filter: 'blur(6px)',
          duration: 0.2,
          stagger: { each: 0.03, from: 'start' },
          ease: 'power2.in',
        })
        .to(
          backdrop,
          {
            opacity: 0,
            scale: 0.93,
            y: -10,
            duration: PANEL_CLOSE_DURATION,
            ease: 'power2.inOut',
          },
          '-=0.06',
        )
    }

    return () => {
      timelineRef.current?.kill()
    }
  }, [isOpen, panelAlive])

  const menuPanel =
    isMobileViewport && panelAlive && mounted && menuTop > 0 ? (
      <nav
        ref={panelRef}
        aria-hidden={!isOpen}
        className="site-nav-mobile-panel pointer-events-auto fixed inset-x-5 z-[260] sm:inset-x-auto sm:left-1/2 sm:w-[70svw] sm:max-w-[70svw] sm:-translate-x-1/2"
        style={{ top: menuTop }}
      >
        <div
          ref={backdropRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-4xl bg-linear-to-br from-sanmarino via-chambray to-casablanca opacity-0"
          style={{ transformOrigin: 'top center', willChange: 'transform, opacity' }}
        />

        <ul
          className={`relative z-10 mx-auto flex w-full flex-col gap-1 px-8 py-12 text-[clamp(1.75rem,7vw,3.75rem)] sm:py-14 ${fonts.bricolage_grot600.className} pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]`}
        >
          {menu_names.map((menu, index) => (
            <li key={menu} className="w-full uppercase">
              <div
                ref={(el) => {
                  itemsRef.current[index] = el
                }}
                className="will-change-[transform,opacity,filter]"
              >
                <Link
                  href={`/${menu}`}
                  onClick={() => {
                    setIsOpen(false)
                    closeSearch()
                  }}
                  className="relative z-10 flex min-h-14 w-full items-center uppercase text-white transition-opacity hover:opacity-80 touch-manipulation [-webkit-tap-highlight-color:transparent]"
                >
                  {getMenuLabel(menu)}
                </Link>
              </div>
            </li>
          ))}
          <li key="client-portal" className="w-full uppercase">
            <div
              ref={(el) => {
                itemsRef.current[menu_names.length] = el
              }}
              className="will-change-[transform,opacity,filter]"
            >
              <button
                type="button"
                aria-current={isClientPortalOpen ? 'page' : undefined}
                onClick={handleOpenClientPortal}
                className={`relative z-10 flex min-h-14 w-full items-center uppercase transition-opacity hover:opacity-80 touch-manipulation [-webkit-tap-highlight-color:transparent] ${isClientPortalOpen ? 'text-casablanca opacity-100' : 'text-white opacity-90'}`}
              >
                {clientPortalNav.label}
              </button>
            </div>
          </li>
        </ul>
      </nav>
    ) : null

  return (
    <div className="site-nav-mobile pointer-events-none fixed inset-x-0 top-0 px-5 pt-5 sm:mx-auto sm:max-w-[70svw]">
      <div className="relative w-full">
        <div
          ref={headerRef}
          className="pointer-events-auto relative z-10 flex h-[10svh] min-h-14 w-full flex-row items-center justify-between rounded-full bg-white/70 backdrop-blur-lg pl-4 pr-6"
        >
          <div className="h-auto w-40">
            <Link
              href="/"
              onClick={() => {
                if (isOpen) setIsOpen(false)
                closeSearch()
              }}
            >
              <Image src={logo} alt="CoCreate Caribbean logo" priority />
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Open search"
              onClick={handleOpenSearch}
              className="flex h-11 w-11 cursor-pointer items-center justify-center text-sanmarino transition-opacity hover:opacity-70"
            >
              <Search className="h-5 w-5" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              onClick={handleToggleMenu}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center"
            >
              <span
                className={`h-5 w-5 rounded-full transition-all duration-500 ease-out ${isOpen ? 'scale-110 bg-chambray' : 'scale-100 bg-sanmarino'}`}
              />
            </button>
          </div>
        </div>

        {menuPanel ? createPortal(menuPanel, document.body) : null}
      </div>
    </div>
  )
}

export default NavMobile
