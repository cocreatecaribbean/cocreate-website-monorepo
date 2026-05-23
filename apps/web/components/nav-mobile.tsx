'use client'

import { menu_names } from '@/site-info/global-site-info'
import logo from '@/public/co_create_logo_hor_blue.svg'
import Image from 'next/image'
import Link from 'next/link'
import * as fonts from '@/styles/fonts'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const PANEL_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const PANEL_DURATION_MS = 480

const NavMobile: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleNavClick = (menu: string) => {
    setIsOpen(false)
    setTimeout(() => {
      router.push(`/${menu}`)
    }, PANEL_DURATION_MS)
  }

  useEffect(() => {
    document.documentElement.style.overflow = isOpen ? 'hidden' : ''
    document.body.classList.toggle('menu-open', isOpen)
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const panelStyle = {
    transform: isOpen ? 'translate3d(0, 0, 0)' : 'translate3d(0, -14px, 0)',
    opacity: isOpen ? 1 : 0,
    visibility: isOpen ? ('visible' as const) : ('hidden' as const),
    pointerEvents: isOpen ? ('auto' as const) : ('none' as const),
    transition: isOpen
      ? `opacity ${PANEL_DURATION_MS}ms ${PANEL_EASE}, transform ${PANEL_DURATION_MS}ms ${PANEL_EASE}, visibility 0ms`
      : `opacity ${PANEL_DURATION_MS}ms ${PANEL_EASE}, transform ${PANEL_DURATION_MS}ms ${PANEL_EASE}, visibility 0ms ${PANEL_DURATION_MS}ms`,
    willChange: 'opacity, transform',
  }

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
          <button
            type="button"
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsOpen((open) => !open)}
            className={`h-5 w-5 shrink-0 cursor-pointer rounded-full transition-colors duration-300 ${isOpen ? 'bg-chambray' : 'bg-sanmarino'}`}
          />
        </div>

        {/* Dropdown — absolutely positioned so nothing clips the rounded card */}
        <nav
          aria-hidden={!isOpen}
          className="absolute top-[calc(100%+0.75rem)] right-0 left-0 isolate overflow-hidden rounded-4xl bg-linear-to-br from-sanmarino via-chambray to-casablanca px-8 py-12 sm:py-14"
          style={panelStyle}
        >
          <ul
            className={`mx-auto flex w-fit flex-col gap-2 text-[clamp(2.25rem,8vw,3.75rem)] ${fonts.bricolage_grot600.className}`}
          >
            {menu_names.map((menu, index) => {
              const linkDelay = isOpen
                ? 100 + index * 65
                : (menu_names.length - 1 - index) * 35
              const linkDuration = isOpen ? 380 : 220

              return (
                <li
                  key={menu}
                  className="uppercase"
                  style={{
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? 'translate3d(0, 0, 0)' : 'translate3d(0, 8px, 0)',
                    transition: `opacity ${linkDuration}ms ${PANEL_EASE}, transform ${linkDuration}ms ${PANEL_EASE}`,
                    transitionDelay: `${linkDelay}ms`,
                  }}
                >
                  <button
                    type="button"
                    className="uppercase text-white transition-opacity hover:opacity-80"
                    onClick={() => handleNavClick(menu)}
                  >
                    {menu.charAt(0).toUpperCase() + menu.slice(1)}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </div>
  )
}

export default NavMobile
