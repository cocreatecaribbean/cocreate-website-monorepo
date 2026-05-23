'use client'

import { menu_names, getMenuLabel } from '@/site-info/global-site-info'
import logo from '@/public/co_create_logo_hor_blue.svg'
import Image from 'next/image'
import Link from 'next/link'
import * as fonts from '@/styles/fonts'
import { usePathname } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { useSearch } from '@/components/search/search-provider'
import gsap from 'gsap'

const PANEL_OPEN_DURATION = 0.72
const PANEL_CLOSE_DURATION = 0.4
const ITEM_STAGGER = 0.08
const CLOSE_NAV_DELAY_MS = 460

const NavMobile: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const pathname = usePathname()
  const router = useRouter()
  const { openSearch } = useSearch()
  const panelRef = useRef<HTMLElement>(null)
  const itemsRef = useRef<(HTMLLIElement | null)[]>([])
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const hasOpenedRef = useRef(false)

  const handleOpenSearch = () => {
    setIsOpen(false)
    openSearch()
  }

  const handleNavClick = (menu: string) => {
    setIsOpen(false)
    setTimeout(() => {
      router.push(`/${menu}`)
    }, CLOSE_NAV_DELAY_MS)
  }

  useEffect(() => {
    document.documentElement.style.overflow = isOpen ? 'hidden' : ''
    document.body.classList.toggle('menu-open', isOpen)
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useLayoutEffect(() => {
    const panel = panelRef.current
    const items = itemsRef.current.filter(Boolean) as HTMLLIElement[]
    if (!panel) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    timelineRef.current?.kill()

    if (prefersReducedMotion) {
      gsap.set(panel, {
        visibility: isOpen ? 'visible' : 'hidden',
        pointerEvents: isOpen ? 'auto' : 'none',
        opacity: isOpen ? 1 : 0,
        scale: 1,
        y: 0,
        clipPath: 'inset(0% 0% 0% 0% round 2rem)',
      })
      gsap.set(items, { opacity: isOpen ? 1 : 0, y: 0, filter: 'blur(0px)' })
      return
    }

    if (isOpen) {
      hasOpenedRef.current = true
      gsap.set(panel, { visibility: 'visible', pointerEvents: 'auto' })

      timelineRef.current = gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        .fromTo(
          panel,
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
        .fromTo(
          items,
          { opacity: 0, y: 36, filter: 'blur(10px)' },
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
      gsap.set(panel, { clipPath: 'inset(0% 0% 0% 0% round 2rem)' })

      timelineRef.current = gsap
        .timeline({
          defaults: { ease: 'power2.inOut' },
          onComplete: () => {
            gsap.set(panel, {
              visibility: 'hidden',
              pointerEvents: 'none',
              scale: 1,
              y: 0,
              clipPath: 'inset(0% 0% 0% 0% round 2rem)',
            })
            gsap.set(items, { opacity: 0, y: 0 })
          },
        })
        .to(items, {
          opacity: 0,
          y: 14,
          duration: 0.2,
          stagger: { each: 0.03, from: 'start' },
          ease: 'power2.in',
        })
        .to(
          panel,
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
  }, [isOpen])

  return (
    <div className="fixed inset-x-0 top-0 z-100 px-5 pt-5 pointer-events-none sm:mx-auto sm:max-w-[70svw]">
      <div className="relative w-full overflow-visible">
        {/* Top bar */}
        <div className="pointer-events-auto relative z-10 flex h-[10svh] min-h-14 w-full flex-row items-center justify-between rounded-full bg-white/70 backdrop-blur-lg pl-4 pr-6">
          <div className="h-auto w-40">
            <Link href="/" onClick={() => isOpen && setIsOpen(false)}>
              <Image src={logo} alt="CoCreate Caribbean logo" priority />
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <button
              type="button"
              aria-label="Open search"
              onClick={handleOpenSearch}
              className="cursor-pointer text-sanmarino transition-opacity hover:opacity-70"
            >
              <Search className="h-5 w-5" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setIsOpen((open) => !open)}
              className={`h-5 w-5 shrink-0 cursor-pointer rounded-full transition-all duration-500 ease-out ${isOpen ? 'scale-110 bg-chambray' : 'scale-100 bg-sanmarino'}`}
            />
          </div>
        </div>

        {/* Dropdown — absolutely positioned so nothing clips the rounded card */}
        <nav
          ref={panelRef}
          aria-hidden={!isOpen}
          className="absolute top-[calc(100%+0.75rem)] right-0 left-0 isolate overflow-hidden rounded-4xl bg-linear-to-br from-sanmarino via-chambray to-casablanca px-8 py-12 sm:py-14"
          style={{
            visibility: 'hidden',
            pointerEvents: 'none',
            opacity: 0,
            transformOrigin: 'top center',
            willChange: 'transform, opacity',
          }}
        >
          <ul
            className={`mx-auto flex w-fit flex-col gap-2 text-[clamp(2.25rem,8vw,3.75rem)] ${fonts.bricolage_grot600.className}`}
          >
            {menu_names.map((menu, index) => (
              <li
                key={menu}
                ref={(el) => {
                  itemsRef.current[index] = el
                }}
                className="uppercase"
                style={{ opacity: 0 }}
              >
                <button
                  type="button"
                  className="uppercase text-white transition-opacity hover:opacity-80"
                  onClick={() => handleNavClick(menu)}
                >
                  {getMenuLabel(menu)}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}

export default NavMobile
