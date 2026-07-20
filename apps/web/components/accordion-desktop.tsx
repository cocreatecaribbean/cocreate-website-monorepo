'use client'

import {
  Accordion,
} from '@base-ui/react/accordion'
import { services } from '@/site-info/global-site-info'
import * as fonts from '@/styles/fonts'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  useWhatWeDoHoverVideo,
  WhatWeDoHoverVideoPreview,
} from '@/components/what-we-do-hover-video'

type AccordionItemEl = HTMLElement & { __rafId?: number }

/** Hover preview only for mouse/trackpad — not touch tablets or phones */
function useHoverVideoEnabled() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setEnabled(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return enabled
}

function stopItemRaf(item: AccordionItemEl) {
  if (item.__rafId != null) {
    cancelAnimationFrame(item.__rafId)
    delete item.__rafId
  }
}

function resetItemChrome(item: HTMLElement) {
  stopItemRaf(item as AccordionItemEl)
  const header = item.querySelector('.group\\/header') as HTMLElement | null
  const trigger = item.querySelector(
    '[data-accordion-trigger]',
  ) as HTMLElement | null
  if (trigger) {
    trigger.style.color = ''
    trigger.style.transform = 'translate(0rem, 0rem)'
  }
  header?.classList.remove('after:bg-transparent')
}

function findAccordionItem(node: EventTarget | null): HTMLElement | null {
  if (!(node instanceof Element)) return null
  return node.closest('[data-accordion-item]') as HTMLElement | null
}

const AccordionDesktop: React.FC = () => {
  const hoverVideoEnabled = useHoverVideoEnabled()
  const { preview, show, move, hide } = useWhatWeDoHoverVideo()
  const hoveredItemRef = useRef<HTMLElement | null>(null)
  const pointerRef = useRef({ x: 0, y: 0 })

  const clearHoverUi = useCallback(() => {
    const item = hoveredItemRef.current
    const root = item?.closest('[data-accordion-root]') as HTMLElement | null

    if (item) {
      resetItemChrome(item)
    }

    if (root) {
      root.style.setProperty('--item-opacity', '0')
      root.querySelectorAll('[data-accordion-item]').forEach((otherItem) => {
        ;(otherItem as HTMLElement).style.opacity = '1'
      })
    }

    hoveredItemRef.current = null
    hide()
  }, [hide])

  // Safari often skips mouseleave when scrolling. Only dismiss when the pointer
  // is no longer over the hovered row — avoids thrashing chrome on pinned scroll.
  useEffect(() => {
    if (!hoverVideoEnabled || !preview.visible) return

    const dismissIfPointerLeft = () => {
      const item = hoveredItemRef.current
      const { x, y } = pointerRef.current
      const el = document.elementFromPoint(x, y)
      if (!item || !el || !item.contains(el)) {
        clearHoverUi()
      }
    }

    window.addEventListener('scroll', dismissIfPointerLeft, {
      capture: true,
      passive: true,
    })
    window.addEventListener('wheel', dismissIfPointerLeft, {
      capture: true,
      passive: true,
    })

    return () => {
      window.removeEventListener('scroll', dismissIfPointerLeft, {
        capture: true,
      })
      window.removeEventListener('wheel', dismissIfPointerLeft, {
        capture: true,
      })
    }
  }, [clearHoverUi, hoverVideoEnabled, preview.visible])

  return (
    <>
      {hoverVideoEnabled ? (
        <WhatWeDoHoverVideoPreview preview={preview} />
      ) : null}
      <Accordion.Root
        className="relative flex w-full flex-col gap-0"
        data-accordion-root
      >
        {/* Shared sliding background */}
        <div
          className="pointer-events-none absolute rounded-3xl bg-casablanca opacity-0 transition-all duration-300 ease-out"
          style={
            {
              width: '103%',
              height: 'var(--item-height)',
              top: 'var(--item-offset)',
              left: '-2%',
              opacity: 'var(--item-opacity)',
              zIndex: 0,
            } as React.CSSProperties
          }
        />

        {services.map((serviceObj) =>
          Object.entries(serviceObj).map(([key, service]) => (
            <Accordion.Item
              key={key}
              className="accordion-item peer relative z-10 transition-opacity duration-300 hover:cursor-pointer hover:opacity-100! peer-hover:opacity-50"
              data-accordion-item
              onMouseEnter={(e) => {
                if (!hoverVideoEnabled) return
                pointerRef.current = { x: e.clientX, y: e.clientY }
                const item = e.currentTarget as AccordionItemEl
                const previous = hoveredItemRef.current
                if (previous && previous !== item) {
                  resetItemChrome(previous)
                }
                hoveredItemRef.current = item
                show(e.clientX, e.clientY, service.previewVideo)

                const root = item.closest(
                  '[data-accordion-root]',
                ) as HTMLElement | null
                const header = item.querySelector(
                  '.group\\/header',
                ) as HTMLElement | null
                const trigger = item.querySelector(
                  '[data-accordion-trigger]',
                ) as HTMLElement | null
                if (!root || !header) return

                root.querySelectorAll('[data-accordion-item]').forEach((otherItem) => {
                  ;(otherItem as HTMLElement).style.opacity =
                    otherItem === item ? '1' : '0.5'
                })

                if (trigger) {
                  trigger.style.color = '#39419a'
                  header.classList.add('after:bg-transparent')
                  trigger.style.transform = 'translate(1rem, 0rem)'
                }

                const updatePosition = () => {
                  const headerRect = header.getBoundingClientRect()
                  const rootRect = root.getBoundingClientRect()
                  const headerHeight = header.offsetHeight
                  const offset = headerRect.top - rootRect.top

                  root.style.setProperty('--item-height', `${headerHeight}px`)
                  root.style.setProperty('--item-offset', `${offset}px`)
                  root.style.setProperty('--item-opacity', '1')

                  item.__rafId = requestAnimationFrame(updatePosition)
                }

                stopItemRaf(item)
                updatePosition()
              }}
              onMouseMove={(e) => {
                if (!hoverVideoEnabled) return
                pointerRef.current = { x: e.clientX, y: e.clientY }
                move(e.clientX, e.clientY)
              }}
              onMouseLeave={(e) => {
                if (!hoverVideoEnabled) return
                const item = e.currentTarget as AccordionItemEl
                resetItemChrome(item)

                const nextItem = findAccordionItem(e.relatedTarget)
                if (nextItem && nextItem !== item) {
                  // Moving onto another row — enter handler will take over.
                  if (hoveredItemRef.current === item) {
                    hoveredItemRef.current = null
                  }
                  return
                }

                // Left the accordion list (or Safari sticky hover): full dismiss.
                clearHoverUi()
              }}
            >
              <Accordion.Header
                className="group/header relative w-full rounded-3xl transition duration-300 after:absolute after:top-full after:left-0 after:block after:h-[2px] after:w-[95%] after:bg-casablanca after:content-[''] group-hover:after:bg-black/50 hover:cursor-pointer hover:after:bg-transparent"
              >
                <Accordion.Trigger
                  data-accordion-trigger
                  className={`${fonts.bricolage_grot500.className}
              relative z-10 inline-block h-full w-full py-8 text-left text-[clamp(2rem,4vw,4rem)] text-white transition duration-300 hover:cursor-pointer xl:text-[clamp(2rem,3vw,5rem)] 3xl:text-[clamp(2rem,3vw,5rem)]`}
                >
                  {service.title}
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel className="grid grid-rows-[0fr] overflow-hidden transition-[grid-template-rows] duration-300 ease-out data-ending-style:grid-rows-[0fr] data-open:grid-rows-[1fr] data-starting-style:grid-rows-[0fr]">
                <div className="min-h-0">
                  <div
                    className={`w-[80%] pt-10 pr-0 pb-24 pl-2 text-3xl text-casablanca xl:text-4xl ${fonts.bricolage_grot400.className}`}
                  >
                    {service.description}
                  </div>
                </div>
              </Accordion.Panel>
            </Accordion.Item>
          )),
        )}
      </Accordion.Root>
    </>
  )
}

export default AccordionDesktop
