'use client'

import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useRef } from 'react'
import * as fonts from '@/styles/fonts'

gsap.registerPlugin(useGSAP)

const BASE_FONT_SIZE = 'clamp(2rem, 3vw, 4rem)'

type PhilosophyLook = {
  name: string
  quote: string
  className: string
  textTransform: 'none' | 'uppercase'
  letterSpacing: string
  /** Uniform scale on base clamp — preserves proportions, no scaleX */
  fontSizeFactor: number
}

const LOOKS: PhilosophyLook[] = [
  {
    name: 'Syne',
    quote: 'Make less, mean more.',
    className: fonts.syne700.className,
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    fontSizeFactor: 0.95,
  },
  {
    name: 'Krona One',
    quote: 'Clarity is creative.',
    className: fonts.kronaOne.className,
    textTransform: 'uppercase',
    letterSpacing: '0em',
    fontSizeFactor: 0.9,
  },
  {
    name: 'Oi',
    quote: 'Ideas need courage.',
    className: fonts.oi.className,
    textTransform: 'none',
    letterSpacing: '0em',
    fontSizeFactor: 0.82,
  },
  {
    name: 'Press Start 2P',
    quote: 'Play with purpose.',
    className: fonts.pressStart2P.className,
    textTransform: 'uppercase',
    letterSpacing: '0em',
    fontSizeFactor: 0.72,
  },
  {
    name: 'Michroma',
    quote: 'Form follows feeling.',
    className: fonts.michroma.className,
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    fontSizeFactor: 0.88,
  },
  {
    name: 'Dela Gothic One',
    quote: 'Restraint is a craft.',
    className: fonts.delaGothicOne.className,
    textTransform: 'uppercase',
    letterSpacing: '0em',
    fontSizeFactor: 0.8,
  },
  {
    name: 'Alien Block',
    quote: 'Bold starts honest.',
    className: fonts.alienBlock.className,
    textTransform: 'uppercase',
    letterSpacing: '0em',
    fontSizeFactor: 0.78,
  },
]

const HOLD_SECONDS = 1.35
const FLIP_SECONDS = 0.28

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function applyLook(el: HTMLElement, look: PhilosophyLook) {
  el.className = [
    'home-philosophy-title',
    'block h-fit leading-none text-center lg:text-left will-change-transform',
    look.className,
  ].join(' ')
  el.style.textTransform = look.textTransform
  el.style.letterSpacing = look.letterSpacing
  el.style.fontSize = `calc(${BASE_FONT_SIZE} * ${look.fontSizeFactor})`
}

/** Tallest Natural height across all looks — locks layout so copy never shifts. */
function measureMaxTitleHeight(title: HTMLElement): number {
  let max = 0
  for (const look of LOOKS) {
    applyLook(title, look)
    max = Math.max(max, title.getBoundingClientRect().height)
  }
  return max
}

type PhilosophyTitleLoopProps = {
  className?: string
}

export default function PhilosophyTitleLoop({
  className = '',
}: PhilosophyTitleLoopProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLHeadingElement>(null)
  const titleRef = useRef<HTMLSpanElement>(null)
  const labelRef = useRef<HTMLParagraphElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      const stage = stageRef.current
      const title = titleRef.current
      const label = labelRef.current
      if (!root || !stage || !title || !label) return

      const setLook = (look: PhilosophyLook) => {
        applyLook(title, look)
        label.textContent = look.quote
      }

      const lockStageHeight = () => {
        stage.style.height = 'auto'
        const maxH = measureMaxTitleHeight(title)
        if (maxH > 0) {
          stage.style.height = `${Math.ceil(maxH)}px`
        }
        setLook(LOOKS[0])
      }

      lockStageHeight()
      void document.fonts?.ready.then(lockStageHeight)

      let resizeTimer: ReturnType<typeof setTimeout> | undefined
      const onResize = () => {
        if (resizeTimer) clearTimeout(resizeTimer)
        resizeTimer = setTimeout(lockStageHeight, 120)
      }
      window.addEventListener('resize', onResize)

      if (prefersReducedMotion()) {
        return () => {
          if (resizeTimer) clearTimeout(resizeTimer)
          window.removeEventListener('resize', onResize)
        }
      }

      const tl = gsap.timeline({ repeat: -1 })

      tl.to({}, { duration: HOLD_SECONDS })

      LOOKS.forEach((_, i) => {
        const next = LOOKS[(i + 1) % LOOKS.length]
        tl.to(title, {
          opacity: 0,
          y: -10,
          duration: FLIP_SECONDS,
          ease: 'power2.in',
          onComplete: () => {
            setLook(next)
            gsap.set(title, { y: 12 })
          },
        })
          .to(title, {
            opacity: 1,
            y: 0,
            duration: FLIP_SECONDS,
            ease: 'power2.out',
          })
          .to({}, { duration: HOLD_SECONDS })
      })

      return () => {
        if (resizeTimer) clearTimeout(resizeTimer)
        window.removeEventListener('resize', onResize)
        tl.kill()
      }
    },
    { scope: rootRef },
  )

  return (
    <div
      ref={rootRef}
      className={`home-philosophy-title-root w-full ${className}`.trim()}
    >
      <h2
        ref={stageRef}
        className="relative w-full min-w-0 overflow-visible"
      >
        <span
          ref={titleRef}
          className="home-philosophy-title inline-block will-change-transform"
        >
          <span className="block">Our</span>
          <span className="block">Philosophy</span>
        </span>
      </h2>
      <p
        ref={labelRef}
        aria-live="polite"
        className="mt-3 text-center text-sm font-medium tracking-wide text-chambray/80 lg:text-left"
      >
        {LOOKS[0].quote}
      </p>
    </div>
  )
}
