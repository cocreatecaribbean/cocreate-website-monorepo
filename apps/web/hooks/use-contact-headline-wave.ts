'use client'

import { type RefObject } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(SplitText, useGSAP)

const WAVE_AMPLITUDE = 5
/** Radians per second — higher = faster wave travel */
const WAVE_SPEED = 1.8
/** Phase offset between adjacent letters (radians) */
const WAVE_PHASE_STEP = 0.4

function isGapChar(char: HTMLElement) {
  return !char.textContent?.trim()
}

/**
 * Gradient on an INNER span so the outer SplitText char can animate `y`
 * reliably (parent/outer bg-clip + text-fill cause ghost glyphs under the nav).
 */
function applyHeadlineCharGradient(chars: HTMLElement[]) {
  const letterChars = chars.filter((char) => !isGapChar(char))
  const total = letterChars.length
  let letterIndex = 0

  chars.forEach((char) => {
    char.style.display = 'inline-block'

    if (isGapChar(char)) {
      char.style.minWidth = '0.45em'
      char.style.width = '0.45em'
      char.style.backgroundImage = 'none'
      char.style.webkitTextFillColor = 'transparent'
      char.style.color = 'transparent'
      return
    }

    const inner = document.createElement('span')
    while (char.firstChild) {
      inner.appendChild(char.firstChild)
    }
    char.appendChild(inner)

    const progress = total > 1 ? (letterIndex / (total - 1)) * 100 : 0
    letterIndex += 1

    inner.style.display = 'inline-block'
    inner.style.backgroundImage =
      'linear-gradient(to right, #406eb5, #406eb5 45%, #f6b03f 80%)'
    inner.style.backgroundSize = `${total * 100}% 100%`
    inner.style.backgroundPosition = `${progress}% 0`
    inner.style.setProperty('-webkit-background-clip', 'text')
    inner.style.backgroundClip = 'text'
    inner.style.setProperty('-webkit-text-fill-color', 'transparent')
  })
}

/** SplitText can drop margin between spans — pad before CoCreate */
function applyWordGap(chars: HTMLElement[]) {
  const cocreateIndex = chars.findIndex(
    (char) => char.textContent === 'C' || char.textContent === 'c',
  )
  if (cocreateIndex < 1) return

  const gapIndex = cocreateIndex - 1
  if (isGapChar(chars[gapIndex])) {
    chars[gapIndex].style.minWidth = '0.45em'
    chars[gapIndex].style.width = '0.45em'
    return
  }

  chars[cocreateIndex].style.marginLeft = '0.45em'
}

type UseContactHeadlineWaveOptions = {
  scope: RefObject<HTMLElement | null>
}

export function useContactHeadlineWave({ scope }: UseContactHeadlineWaveOptions) {
  useGSAP(
    () => {
      const heading = scope.current?.querySelector<HTMLElement>('.contact-page-title')
      if (!heading) return

      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      if (prefersReducedMotion) return

      const split = new SplitText(heading, { type: 'chars' })
      const chars = split.chars as HTMLElement[]

      applyHeadlineCharGradient(chars)
      applyWordGap(chars)

      gsap.set(chars, {
        opacity: 1,
        visibility: 'visible',
        transformOrigin: '50% 100%',
        willChange: 'transform',
      })

      const start = performance.now()

      const tick = () => {
        const t = ((performance.now() - start) / 1000) * WAVE_SPEED

        chars.forEach((char, index) => {
          const isSpace = isGapChar(char)
          gsap.set(char, {
            y: isSpace ? 0 : Math.sin(t + index * WAVE_PHASE_STEP) * WAVE_AMPLITUDE,
          })
        })
      }

      gsap.ticker.add(tick)

      return () => {
        gsap.ticker.remove(tick)
        gsap.killTweensOf(chars)
        split.revert()
      }
    },
    { scope },
  )
}
